export interface DimmerInterface {
    dimmed: boolean;
    dimmerMessage: string;
    enableDimmer(msg: string, isError: boolean): void;
    enableDimmer(msg: string): void;
    disableDimmer(): void;
}
