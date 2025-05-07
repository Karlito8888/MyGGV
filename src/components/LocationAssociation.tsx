import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Location {
  id: string;
  block: string;
  lot: string;
}

interface LocationAssociation {
  profile_id: string;
  location_id: string;
  location?: Location;
}

export const LocationAssociation = () => {
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [blocks, setBlocks] = useState<string[]>([]);
  const [selectedBlock, setSelectedBlock] = useState("");
  const [filteredLots, setFilteredLots] = useState<Location[]>([]);
  const [myAssociations, setMyAssociations] = useState<LocationAssociation[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [selectedLot, setSelectedLot] = useState("");

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load my associations with location information
      const { data: associationsData, error: associationsError } =
        await supabase
          .from("profile_location_associations")
          .select(
            `
          *,
          location:locations(*)
        `
          )
          .eq("profile_id", user.id);

      if (associationsError) throw associationsError;

      // Load all available locations
      const { data: locationsData, error: locationsError } = await supabase
        .from("locations")
        .select("*")
        .is("deleted_at", null)
        .order("block", { ascending: true });

      if (locationsError) throw locationsError;

      const uniqueBlocks = [...new Set(locationsData.map((loc) => loc.block))];
      const sortedBlocks = uniqueBlocks.sort((a, b) => Number(a) - Number(b));

      setLocations(locationsData);
      setBlocks(sortedBlocks);
      setMyAssociations(associationsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBlock) {
      const lots = locations
        .filter(
          (loc) =>
            loc.block === selectedBlock &&
            !myAssociations.some((assoc) => assoc.location_id === loc.id)
        )
        .sort((a, b) => Number(a.lot) - Number(b.lot));

      setFilteredLots(lots);
      setSelectedLot("");
    }
  }, [selectedBlock, locations, myAssociations]);

  const addAssociation = async (locationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profile_location_associations")
        .insert({
          profile_id: user.id,
          location_id: locationId,
          is_active: true,
          is_verified: true, // Directly verified!
        });

      if (error) throw error;

      await fetchData();
    } catch (error) {
      console.error("Error adding association:", error);
    }
  };

  const removeAssociation = async (locationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profile_location_associations")
        .delete()
        .match({
          profile_id: user.id,
          location_id: locationId,
        });

      if (error) throw error;

      await fetchData();
    } catch (error) {
      console.error("Error removing association:", error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="location-association">
      {/* <h3>My Location</h3> */}

      {/* List of existing associations */}
      <div className="my-locations">
        {myAssociations.length === 0 ? (
          <p>No associated locations</p>
        ) : (
          myAssociations.map((assoc) => (
            <div key={assoc.location_id} className="location-item">
              <span>
                Block {assoc.location?.block} - Lot {assoc.location?.lot}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeAssociation(assoc.location_id)}
              >
                Remove
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Add association form */}
      {myAssociations.length === 0 && (
        <div className="add-location">
          <h4>Add a Location</h4>
          <Select value={selectedBlock} onValueChange={setSelectedBlock}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a block" />
            </SelectTrigger>
            <SelectContent>
              {blocks.map((block) => (
                <SelectItem key={block} value={block} className="text-lg">
                  Block {block}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedBlock && (
            <div className="mt-4">
              <Select
                value={selectedLot}
                onValueChange={setSelectedLot}
                disabled={filteredLots.length === 0}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue
                    placeholder={
                      filteredLots.length === 0
                        ? "No available lots"
                        : "Select a lot"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredLots.map((lot) => (
                    <SelectItem key={lot.id} value={lot.id} className="text-lg">
                      Lot {lot.lot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedLot && (
                <Button
                  className="mt-4"
                  onClick={() => addAssociation(selectedLot)}
                >
                  Add this location
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
