export interface POI {
    id: string;
    name: string;
    description: string;
    latitude: number;
    longitude: number;
}
export declare const usePoi: () => {
    poi: POI[];
    loading: boolean;
    error: string | null;
};
