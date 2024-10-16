import React, { useState, useEffect } from "react";
import { entityService } from "../services/entityService";
import { linksService } from "../services/linksService";
import { Layer, Link } from "../types";
import { ChevronLeft, ChevronRight, Save, Trash } from "lucide-react";

const Links: React.FC = () => {
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay(); // getDay() gives 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    const diff = d.getDate() - day; // Calculate the difference from the current day to Sunday
    return new Date(d.setDate(diff));
  };
  
  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getWeekRange = (date: Date) => {
    const weekStart = getStartOfWeek(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return {
      start: formatDate(weekStart),
      end: formatDate(weekEnd),
    };
  };
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekRange, setWeekRange] = useState(getWeekRange(new Date()));
  const [originalLinks, setOriginalLinks] =useState<Record<number, Link>>({});
  const [links, setLinks] = useState<Record<number, Link>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLayers();
    fetchLinks();
  }, []);

  useEffect(() => {
    setWeekRange(getWeekRange(selectedDate));
    fetchLinks();
  }, [selectedDate]);

  const fetchLayers = async () => {
    try {
      const fetchedLayers = await entityService.getAllLayers();
      setLayers(fetchedLayers);
    } catch (err) {
      setError("Failed to fetch layers");
    }
  };

  const fetchLinks = async () => {
    setIsLoading(true);
    try {
      const fetchedLinks = await linksService.getLinksByWeek(
        formatDate(selectedDate)
      );
      const linkMap: Record<number, Link> = {};
      fetchedLinks.forEach((link) => {
        if (link.layer) {
          linkMap[link.layer.id] = link || "";
        }
      });
      setOriginalLinks(linkMap);
      setLinks(linkMap)
    } catch (err) {
      setError("Failed to fetch links");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if(
      JSON.stringify(originalLinks) ===JSON.stringify(links) 
    ){
      console.log('no changes to links')
return;       
    }
    setIsLoading(true);
    try {
      for (const layer of layers) {
        const link = links[layer.id] || "";
        if (link) {
          await linksService.createLink({
            layerId: layer.id,
            link: links[layer.id].link,
            weekStart: weekRange.start,
          });
        }
      }fetchLinks()
      setError("Links saved successfully");
    } catch (err) {
      setError("Failed to save links");
    } finally {
      setIsLoading(false);
    }
    setTimeout(() => setError(null), 3000);
  };

  const handleDelete = async (layerId: number) => {
    console.log(links)
    console.log(layerId)
    setIsLoading(true);
    try {
      const linkToDelete = Object.entries(links).find(
        ([id]) => parseInt(id) === layerId
      );
     if (linkToDelete) {
        await linksService.deleteLink(links[layerId].id ||0 );
        setLinks((prevLinks) => {
          const newLinks = { ...prevLinks };
          delete newLinks[layerId];
          return newLinks;
        });
        setError("Link deleted successfully");
      }else{

        setError("Link does not exist");

      }
    } catch (err) {
      setError("Failed to delete link");
    } finally {
      setIsLoading(false);
    }
    setTimeout(() => setError(null), 3000);
  };

  const handlePreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  return (
    <div className="bg-gray-100 min-h-auto">
      <div className="container  ">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div style={{ backgroundImage: `url(makanBackgroundDark.png)` }} className="sticky p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center justify-center w-full">
                <button
                  onClick={handlePreviousWeek}
                  className="btn shadow-lg text-gray-100 btn-outline hover:bg-gray-100 hover:text-[#196A58] ml-4 hover:border-green-500 btn-sm"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous Week
                </button>
                <div className="text-2xl font-extra-bold text-gray-100 mx-4">
                  {weekRange.start} to {weekRange.end}
                </div>
                <button
                  onClick={handleNextWeek}
                  className="btn shadow-lg text-gray-100 btn-outline hover:bg-gray-100 hover:text-[#196A58] ml-4 hover:border-green-500 btn-sm"
                >
                  Next Week
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {isLoading && (
              <div className="flex justify-center my-4">
                <div className="loading loading-spinner loading-lg text-primary"></div>
              </div>
            )}

            {error && (
              <div
                className={`flex justify-center mb-2 p-2 rounded-lg ${
                  error.includes("successfully")
                    ? "bg-green-100 text-green-700 font-bold"
                    : "bg-red-100 font-bold text-red-700"
                }`}
              >
                {error}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th className="bg-gray-100 text-left text-gray-600 uppercase text-sm leading-normal">
                      Layer Name
                    </th>
                    <th className="bg-gray-100 text-left text-gray-600 uppercase text-sm leading-normal">
                      Link
                    </th>
                    <th className="bg-gray-100 text-left text-gray-600 uppercase text-sm leading-normal">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {layers.map((layer) => (
                    <tr
                      key={layer.id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="py-3 px-6 text-left whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {layer.name}
                        </div>
                      </td>
                      <td className="py-3 px-6">
                        <input
                          type="text"
                          placeholder="Enter link"
                          className="input input-bordered w-full max-w-xs"
                          value={links[layer.id]?.link || ""}
                          onChange={(e) =>
                            setLinks((prev) => ({
                              ...prev,
                              [layer.id]: {
                                ...prev[layer.id], // Spread the existing properties of the object
                                link: e.target.value, // Update the 'link' property
                              },
                            }))
                          }
                        />
                      </td>
                      <td className="flex space-x-2 py-3 px-6">
                        <button
                          className="text-white p-1 rounded pr-2 pl-2 hover:outline-white bg-[#196A58]"
                          onClick={handleSave}
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          className="text-white p-1 rounded pr-2 pl-2 hover:outline-white bg-red-600"
                          onClick={() => handleDelete(layer.id || 0)}
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Links;
