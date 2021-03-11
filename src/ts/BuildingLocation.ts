import { Option, Some, None, fromMap } from "@nvarner/monads";
import { LatLng } from "leaflet";
import RBush, { BBox } from "rbush/rbush";
import { kdTree } from "kd-tree-javascript";
import { Geocoder, GeocoderDefinition } from "./Geocoder";
import { T2 } from "./Tuple";

export class BuildingLocation {
    public readonly xy: LatLng;
    public readonly floor: string;

    constructor(xy: LatLng, floor: string) {
        this.xy = xy;
        this.floor = floor;
    }

    public distanceTo(other: BuildingLocation): Option<number> {
        if (this.floor === other.floor) {
            const dlat = other.xy.lat - this.xy.lat;
            const dlng = other.xy.lng - this.xy.lng;
            return Some(Math.sqrt((dlat * dlat) + (dlng * dlng)));
        } else {
            return None;
        }
    }
}

/**
 * Represents a building location that has (an) entrance(s) that may be distinct from its center point.
 */
export class BuildingLocationWithEntrances {
    private center: BuildingLocation;
    private entrances: BuildingLocation[];

    /**
     * @param center Single point that represents the location, usually its center. Used as the only entrance iff there
     * are no provided entrances.
     * @param entrances Location of entrance(s). If any are specified, the center is not treated as an entrance unless
     * it is included in this list.
     */
    constructor(center: BuildingLocation, entrances: BuildingLocation[]) {
        this.center = center;
        this.entrances = entrances;
    }

    public getCenter(): BuildingLocation {
        return this.center;
    }

    public getEntrances(): BuildingLocation[] {
        if (this.entrances.length === 0) {
            return [this.center];
        }
        return this.entrances;
    }

    public distanceTo(other: BuildingLocationWithEntrances): Option<number> {
        return this.getCenter().distanceTo(other.getCenter());
    }
}

class BuildingGeocoderRBush extends RBush<T2<T2<number, number>, BuildingGeocoderDefinition>> {
    toBBox(pointDefinition: T2<T2<number, number>, BuildingGeocoderDefinition>): BBox {
        const point = pointDefinition.e0;
        return {
            minX: point.e0,
            minY: point.e1,
            maxX: point.e0,
            maxY: point.e1
        };
    }

    compareMinX(
        a: T2<T2<number, number>, BuildingGeocoderDefinition>,
        b: T2<T2<number, number>, BuildingGeocoderDefinition>
    ): number {
        return a.e0.e0 - b.e0.e0;
    }

    compareMinY(
        a: T2<T2<number, number>, BuildingGeocoderDefinition>,
        b: T2<T2<number, number>, BuildingGeocoderDefinition>
    ): number {
        return a.e0.e1 - b.e0.e1;
    }
}

export class BuildingGeocoder extends Geocoder<BuildingLocationWithEntrances> {
    private readonly roomCenterIndices: Map<string, BuildingKDTree>;

    public constructor() {
        super();

        this.roomCenterIndices = new Map();
    }

    public addDefinition(definition: BuildingGeocoderDefinition): boolean {
        if (!super.addDefinition(definition)) { return false; }

        const floor = definition.location.getCenter().floor;

        const tree = fromMap(this.roomCenterIndices, floor).unwrapOr(new kdTree([], distanceBetween, ["x", "y"]));
        tree.insert(definitionToKDTreeEntry(definition));
        this.roomCenterIndices.set(floor, tree);

        return true;
    }

    public getClosestDefinition(location: BuildingLocationWithEntrances): BuildingGeocoderDefinition {
        const center = location.getCenter();
        const tree = fromMap(this.roomCenterIndices, center.floor).unwrap();
        const [closest] = tree.nearest(locationToKDTreeEntry(location), 1);
        return closest[0].definition.unwrap();
    }
}

export type BuildingGeocoderDefinition = GeocoderDefinition<BuildingLocationWithEntrances>;

interface KDTreeEntry {
    x: number,
    y: number,
    definition: Option<BuildingGeocoderDefinition>
}
type BuildingKDTree = kdTree<KDTreeEntry>;

function definitionToKDTreeEntry(definition: BuildingGeocoderDefinition): KDTreeEntry {
    const location = definition.location.getCenter().xy;
    return {
        x: location.lng,
        y: location.lat,
        definition: Some(definition)
    };
}

function locationToKDTreeEntry(location: BuildingLocationWithEntrances): KDTreeEntry {
    const xy = location.getCenter().xy;
    return {
        x: xy.lng,
        y: xy.lat,
        definition: None
    }
}

function distanceBetween(a: KDTreeEntry, b: KDTreeEntry): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt((dx * dx) + (dy * dy));
}
