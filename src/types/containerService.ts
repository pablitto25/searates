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
  const res = await fetch("/api/containers");
  if (!res.ok) throw new Error("Failed to fetch container list");
  const data: ContainerResponse[] = await res.json();
  return data;
}