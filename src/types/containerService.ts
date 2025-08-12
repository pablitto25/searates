import { ContainerResponse } from "@/types/container";

export async function fetchContainer(containerNumber: string): Promise<ContainerResponse | null> {
  try {
    const res = await fetch(`/api/container?number=${containerNumber}`);
    if (!res.ok) throw new Error("Failed to fetch container data");
    const data: ContainerResponse = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching container:", error);
    return null;
  }
}

export async function fetchAllContainers(): Promise<ContainerResponse[]> {
  try {
    const res = await fetch('/api/containers', {
      cache: 'no-store', // Evitar caché
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching containers:", error);
    throw error;
  }
}