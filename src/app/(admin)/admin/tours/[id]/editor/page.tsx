import React from 'react';
import { notFound } from 'next/navigation';
import { TourService } from '@/server/services/tour.service';
import { HotspotStudio } from '@/components/editor/HotspotStudio';

export default async function TourEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ scene?: string }>;
}) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const tour = await TourService.getById(id);

  if (!tour) {
    notFound();
  }

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8">
      <HotspotStudio
        tourId={id}
        initialTour={JSON.parse(JSON.stringify(tour))}
        initialSceneId={query.scene}
      />
    </div>
  );
}
