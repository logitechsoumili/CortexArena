from typing import List, Dict

# Mapping of amenities to zone IDs
STADIUM_FACILITIES: Dict[str, List[Dict[str, str]]] = {
    "food": [
        {"zone_id": "NE_concourse", "name": "North-East Plaza Eats"},
        {"zone_id": "SE_concourse", "name": "South-East Burger Hub"},
        {"zone_id": "SW_concourse", "name": "South-West Taco Stand"},
        {"zone_id": "NW_concourse", "name": "North-West Beverage Bar"},
    ],
    "washroom": [
        {"zone_id": "N_concourse", "name": "North Sector Restrooms"},
        {"zone_id": "S_concourse", "name": "South Sector Restrooms"},
        {"zone_id": "E_concourse", "name": "East Sector Restrooms"},
        {"zone_id": "W_concourse", "name": "West Sector Restrooms"},
    ],
    "first_aid": [
        {"zone_id": "S_outer", "name": "South Outer Medical Center"},
        {"zone_id": "N_outer", "name": "North Outer First Aid"},
    ],
    "merch": [
        {"zone_id": "N_outer", "name": "Cortex Arena Official Merch"},
        {"zone_id": "S_concourse", "name": "Sector S Merch Booth"},
    ],
    "exit": [
        {"zone_id": "N_concourse", "name": "Main North Gate"},
        {"zone_id": "S_concourse", "name": "Main South Gate"},
        {"zone_id": "E_concourse", "name": "East Perimeter Exit"},
        {"zone_id": "W_concourse", "name": "West Perimeter Exit"},
    ]
}

def get_facility_status(facilities_type: str, zones_data: dict) -> List[dict]:
    """Helper to get amenities with their current zone density."""
    results = []
    amenities = STADIUM_FACILITIES.get(facilities_type, [])
    for am in amenities:
        zone = zones_data.get(am["zone_id"])
        if zone:
            results.append({
                "name": am["name"],
                "zone_id": am["zone_id"],
                "occupancy": zone.occupancy,
                "capacity": zone.capacity,
                "density": round(zone.occupancy / zone.capacity, 2) if zone.capacity > 0 else 0,
                "status": zone.status
            })
    return results
