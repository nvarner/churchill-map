import { IMapView } from "./IMapView";
import { Map as LMap } from "leaflet";
import { LFloors, LSomeLayerWithFloor } from "../../LFloorsPlugin/LFloorsPlugin";
import { Sidebar } from "./Sidebar/Sidebar";
import { IGeocoderDefinition } from "../../Geocoder/IGeocoderDefinition";
import { GeocoderSuggestion } from "../../Geocoder/GeocoderSuggestion";
import { BuildingLocation } from "../../BuildingLocation/BuildingLocation";

export class LeafletMapView implements IMapView {
    static inject = ["map", "floors", "sidebar"] as const;
    public constructor(
        private readonly map: LMap,
        private readonly floors: LFloors,
        private readonly sidebar: Sidebar
    ) {}

    /**
     * Register a callback for when a search result is clicked
     * @param onClickResult The callback, which takes in the suggestion corresponding to the clicked search result
     */
    public registerOnClickSearchResult(onClickResult: (result: GeocoderSuggestion) => void): void {
        this.sidebar.registerOnClickSearchResult(onClickResult);
    }

    /**
     * Register a callback for when a closest <something. (eg. closest bathroom) button is clicked
     * @param onClickClosest The callback, which takes in the closest definition and the definition the user is starting
     * from
     */
    public registerOnClickClosest(
        onClickClosest: (closest: IGeocoderDefinition, starting: BuildingLocation) => void
    ): void {
        this.sidebar.registerOnClickClosest(onClickClosest);
    }

    /**
     * Register a callback for when a definition is focused
     * @param onFocusDefinition The callback, which takes in the definition being focused
     */
    public registerOnFocusDefinition(onFocusDefinition: (definition: IGeocoderDefinition) => void): void {
        this.sidebar.registerOnFocusDefinition(onFocusDefinition);
    }

    private goToDefinition(definition: IGeocoderDefinition): void {
        const location = definition.getLocation();
        this.map.fitBounds(definition.getBoundingBox().toLatLngBounds());
        this.floors.setFloor(location.getFloor());
    }

    public focusOnDefinition(definition: IGeocoderDefinition): void {
        this.goToDefinition(definition);
        this.sidebar.openInfoFor(definition);
    }

    public clearNav(): void {
        this.sidebar.clearNav();
    }

    public displayNav(layers: Set<LSomeLayerWithFloor>): void {
        this.sidebar.displayNav(layers);
    }
}