import { BuildingLocation } from "../../../../BuildingLocation/BuildingLocation";
import { DefinitionTag } from "../../../../Geocoder/DefinitionTag";
import { Geocoder } from "../../../../Geocoder/Geocoder";
import { GeocoderDefinition } from "../../../../Geocoder/GeocoderDefinition";
import { LFloors } from "../../../../LFloorsPlugin/LFloorsPlugin";
import { Locator } from "../../../../Locator";
import { MapData } from "../../../../MapData";
import { ClosestDefinitionButton } from "./ClosestDefinitionButton";

export class ClosestBleedingControlKitButton extends ClosestDefinitionButton {
    public constructor(
        geocoder: Geocoder,
        locator: Locator,
        mapData: MapData,
        floorsLayer: LFloors,
        onGetClosest: (
            closest: GeocoderDefinition,
            starting: BuildingLocation,
        ) => void,
    ) {
        super(
            geocoder,
            locator,
            mapData,
            floorsLayer,
            (definition) =>
                !definition.hasTag(DefinitionTag.Closed) &&
                definition.hasTag(DefinitionTag.BleedControl),
            "fas fa-band-aid",
            "Nearest Bleeding Control Kit",
            onGetClosest,
        );
    }
}
