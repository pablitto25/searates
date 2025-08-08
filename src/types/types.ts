// src/types/types.ts
export type LineCapShape = 'butt' | 'round' | 'square' | 'inherit';
export type LineJoinShape = 'miter' | 'round' | 'bevel' | 'inherit';

export interface LineStyleOptions {
    color: string;
    weight: number;
    opacity: number;
    dashArray?: string;
    lineCap?: LineCapShape;
    lineJoin?: LineJoinShape;
}