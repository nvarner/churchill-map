import { circle, circleMarker, LayerGroup } from "leaflet";

import { None, Option, Some } from "@nvarner/monads";

import { Locator, PositionState } from "../Locator";
import { ISettings } from "../settings/ISettings";
import { LLocationControl } from "./LLocationControl";

export class LLocation extends LayerGroup {
    private readonly control: LLocationControl;

    private hidingLocation: boolean;
    private positionMarker: Option<PositionMarker>;

    private map: Option<L.Map>;

    public static inject = ["locator", "settings"] as const;
    /**
     * Creates a new layer that shows the user's location on the map.
     * @param options Any extra Leaflet layer options
     */
    public constructor(private readonly locator: Locator, settings: ISettings) {
        super([], {
            attribution: "© OpenStreetMap contributors",
        });

        this.control = new LLocationControl(
            () => {
                this.locate();
            },
            { position: "topright" },
        );

        this.positionMarker = None;
        this.map = None;

        this.hidingLocation = false;
        settings.addWatcher("hiding-location", (hidingLocationUnknown) => {
            const hidingLocation = hidingLocationUnknown as boolean;
            this.onChangeHidingLocation(hidingLocation);
        });

        locator.addStateUpdateHandler(
            (_oldState, newState, position, accuracyRadius) =>
                this.onLocationStateChange(newState, position, accuracyRadius),
        );
        this.onLocationStateChange(locator.getPositionState(), None, None);
    }

    public onAdd(map: L.Map): this {
        super.onAdd(map);
        this.control.addTo(map);
        this.map = Some(map);

        return this;
    }

    public onRemove(map: L.Map): this {
        super.onRemove(map);
        map.removeControl(this.control);
        return this;
    }

    private onLocationStateChange(
        newState: PositionState,
        position: Option<L.LatLng>,
        accuracyRadius: Option<number>,
    ): void {
        switch (newState) {
            case PositionState.NearChurchill:
                {
                    this.positionMarker.ifSome((positionMarker) =>
                        super.removeLayer(positionMarker),
                    );
                    const positionMarker = new PositionMarker(
                        position.unwrap(),
                        accuracyRadius.unwrap(),
                    );
                    this.positionMarker = Some(positionMarker);
                    if (!this.hidingLocation) {
                        super.addLayer(positionMarker);
                    }
                    // When near Churchill, location is available
                    this.control.onLocationAvailable();
                }
                break;
            case PositionState.NotNearChurchill:
                this.positionMarker.ifSome((positionMarker) =>
                    super.removeLayer(positionMarker),
                );
                // When not near Churchill, location is not available
                this.control.onLocationNotAvailable();
                break;
            case PositionState.UnsureNearChurchill:
                // Show greyed out circle instead
                this.positionMarker.ifSome((positionMarker) =>
                    super.removeLayer(positionMarker),
                );
                this.positionMarker = this.positionMarker.map(
                    (_) =>
                        new PositionMarker(
                            position.unwrap(),
                            accuracyRadius.unwrap(),
                            true,
                        ),
                );
                this.control.onLocationAvailable();
                break;
            case PositionState.Unknown:
                this.positionMarker.ifSome((positionMarker) =>
                    super.removeLayer(positionMarker),
                );
                this.control.onLocationNotAvailable();
                break;
        }
    }

    private locate(): void {
        this.locator.getLatestPosition().ifSome((position) => {
            this.map.ifSome((map) => {
                map.flyTo(position, 2.5);
            });
        });
    }

    private onChangeHidingLocation(hidingLocation: boolean): void {
        this.hidingLocation = hidingLocation;

        this.positionMarker.ifSome((positionMarker) => {
            if (
                this.locator.getPositionState() == PositionState.NearChurchill
            ) {
                if (this.hidingLocation) {
                    super.removeLayer(positionMarker);
                } else {
                    super.addLayer(positionMarker);
                }
            }
        });
    }
}

class PositionMarker extends LayerGroup {
    public constructor(
        position: L.LatLng,
        accuracyRadius: number,
        unsure = false,
    ) {
        const color = unsure ? "#bcbcbc" : "#3388ff";

        const positionPoint = circleMarker(position, {
            radius: 1,
            color: color,
        });
        const accuracyCircle = circle(position, {
            stroke: false,
            radius: accuracyRadius,
            color: color,
        });

        super([positionPoint, accuracyCircle]);
    }
}
