import { BuildingLocationWithEntrances } from "./BuildingLocation";
import { DefinitionTag, GeocoderDefinition } from "./Geocoder";
import { deepCopy } from "./utils";

export class LocationOnlyDefinition implements GeocoderDefinition {
    public constructor(
        private readonly location: BuildingLocationWithEntrances,
        private readonly alternateNames: string[] = []
    ) {}

    public getLocation(): BuildingLocationWithEntrances {
        return this.location;
    }

    public getName(): string {
        return "";
    }
    public getAlternateNames(): string[] {
        return this.alternateNames;
    }

    public getDescription(): string {
        return "";
    }

    public getTags(): DefinitionTag[] {
        return [];
    }

    public hasTag(_tag: DefinitionTag): boolean {
        return false;
    }

    public extendedWithAlternateName(name: string): GeocoderDefinition {
        const newNames = deepCopy(this.alternateNames);
        newNames.push(name);
        return new LocationOnlyDefinition(this.location, newNames);
    }
}