import { BuildingLocationWithEntrances } from "./BuildingLocation";
import { Geocoder } from "./Geocoder";

export function capFirstLetter(toCap: string): string {
    if (toCap.length < 1) {
        return "";
    }
    return toCap.charAt(0).toUpperCase() + toCap.substring(1);
}

export function titleCap(toCap: string): string {
    return toCap.split(" ")
        .map((word) => capFirstLetter(word))
        .join(" ");
}

const geocoder: Geocoder<BuildingLocationWithEntrances> = new Geocoder();
export { geocoder };
