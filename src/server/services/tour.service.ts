import prisma from '@/lib/prisma';
import { slugify } from '@/lib/utils';
import { TourStatus, TourVisibility } from '@prisma/client';

export interface CreateTourInput {
  title: string;
  slug?: string;
  description?: string;
  visibility?: TourVisibility;
  ownerId: string;
}

export class TourService {
  static async create(input: CreateTourInput) {
    const baseSlug = input.slug ? slugify(input.slug) : slugify(input.title);
    let finalSlug = baseSlug;
    let count = 1;

    // Check slug collision
    while (await prisma.tour.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${count++}`;
    }

    return prisma.tour.create({
      data: {
        title: input.title,
        slug: finalSlug,
        description: input.description,
        visibility: input.visibility || 'PUBLIC',
        ownerId: input.ownerId,
        status: 'DRAFT',
      },
    });
  }

  static async list(params: {
    search?: string;
    status?: TourStatus;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 12;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { title: { contains: params.search } },
        { description: { contains: params.search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.tour.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          coverMedia: true,
          startScene: true,
          _count: {
            select: {
              scenes: true,
              buildings: true,
              views: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.tour.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getById(id: string) {
    return prisma.tour.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        coverMedia: true,
        startScene: {
          include: {
            panoramaAsset: { include: { mediaAsset: true } },
          },
        },
        scenes: {
          orderBy: { sortOrder: 'asc' },
          include: {
            panoramaAsset: { include: { mediaAsset: true } },
            building: true,
            floor: true,
            sourceHotspots: {
              include: {
                targetScene: { select: { id: true, name: true } },
              },
            },
          },
        },
        buildings: {
          orderBy: { sortOrder: 'asc' },
          include: {
            floors: {
              orderBy: { levelNumber: 'asc' },
              include: {
                floorPlan: {
                  include: {
                    mediaAsset: true,
                    markers: { include: { scene: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  static async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      coverMediaId?: string | null;
      startSceneId?: string | null;
      status?: TourStatus;
      visibility?: TourVisibility;
    }
  ) {
    return prisma.tour.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    // First clear startSceneId circular dependency to prevent foreign key constraint block
    await prisma.tour.update({
      where: { id },
      data: { startSceneId: null },
    });
    return prisma.tour.delete({ where: { id } });
  }
}