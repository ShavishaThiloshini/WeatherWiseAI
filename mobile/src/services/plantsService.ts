import { apiFetch } from './api';
export interface Plant { id: string; name: string; species: string; locationId: string; location: string; wateringEveryDays: number; lastWateredAt: string | null; createdAt: string; }
export async function listPlants(): Promise<Plant[]> { return (await apiFetch<{ plants: Plant[] }>('/plants')).plants; }
export async function createPlant(input: { name: string; species?: string; wateringEveryDays: number }): Promise<Plant> { return (await apiFetch<{ plant: Plant }>('/plants', { method: 'POST', body: JSON.stringify(input) })).plant; }
export async function waterPlant(id: string): Promise<Plant> { return (await apiFetch<{ plant: Plant }>(`/plants/${encodeURIComponent(id)}/water`, { method: 'POST' })).plant; }
export async function deletePlant(id: string): Promise<void> { await apiFetch<void>(`/plants/${encodeURIComponent(id)}`, { method: 'DELETE' }); }
