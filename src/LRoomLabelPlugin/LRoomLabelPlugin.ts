import * as L from "leaflet";

// @ts-ignore rbush does export default
import { default as rbush } from "rbush";

import "./label.scss";
import MapData from "../MapData";

export default class LRoomLabel extends L.LayerGroup {
    private tree: any;
    private hiddenLayers: L.Marker[];

    constructor(map: MapData, floor: string, options?: L.LayerOptions){
        super([], options);
        this.tree = rbush();
        this.hiddenLayers = [];

        for (const room of map.getAllRooms()) {
            const entrances = room.getEntrances();
            if (entrances.length > 0 && map.getGraph().getVertex(entrances[0]).getFloor() === floor) {
                const location = room.getCenter() ? room.getCenter() :
                    map.getGraph().getVertex(room.getEntrances()[0]).getLocation();
                this.addLayer(L.marker([location[1], location[0]], {
                    "icon": L.divIcon({
                        "html": room.getRoomNumber(),
                        className: "room-label"
                    }),
                    "interactive": false
                }));
            }
        }
    }

    addLayer(layer: L.Marker):  this {
        super.addLayer(layer);
        this.hiddenLayers.push(layer);
        return this;
    }

    onAdd(map: L.Map): this {
        super.onAdd(map);
        map.on("zoomend", this.reload, this);
        this.reload();
        return this;
    }

    onRemove(map: L.Map): this {
        super.onRemove(map);
        map.removeEventListener("zoomend", this.reload, this);
        return this;
    }

    reload() {
        this.setupRbush();
        this.hideAllLayers();
        this.showVisibleLayers();
    }

    private showVisibleLayers() {
        for (const layer of this.hiddenLayers) {
            const rbushBb = layer["bb"];
            if (this.tree.search(rbushBb).length === 1) {
                layer["_icon"].classList.remove("invisible");
            } else {
                this.tree.remove(rbushBb);
            }
        }
    }

    private hideAllLayers() {
        const shownLayers = super.getLayers();
        for (const layer of shownLayers) {
            layer["_icon"].classList.add("invisible");
        }
    }

    private setupRbush() {
        this.tree.clear();
        const rbushBoxes = [];
        for (const layer of this.hiddenLayers) {
            layer["bb"] = LRoomLabel.bbToRbush(layer["_icon"].getBoundingClientRect());
            rbushBoxes.push(layer["bb"]);
        }
        this.tree.load(rbushBoxes);
    }

    private static bbToRbush(bb: ClientRect): { minX: number, minY: number, maxX: number, maxY: number } {
        return {
            minX: bb.left,
            minY: bb.top,
            maxX: bb.right,
            maxY: bb.bottom
        };
    }
}
