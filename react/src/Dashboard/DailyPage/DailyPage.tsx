/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import LayerDetails from "./LayerDetails";
import { Layer, ProductionRole } from '../../types';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import TargetsChart from "./TargetsChart";
import SupervisorTeamOverview from "./SupervisorTeamOverview";

const DailyPage = () => {
    const [date, setDate] = useState<Date>(new Date());
    const [selectedLayer, setSelectedLayer] = useState<Layer | null | undefined>(null);
    //const [comments, setComments] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<number | null>();
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [selectedProductionRole, setSelectedProductionRole] = useState<ProductionRole>(ProductionRole.Production);

    const handleProductionRoleSelect = (productionRole: ProductionRole) => {
        setSelectedProductionRole(productionRole);
    };

    // useEffect(() => {
    //     const fetchData = async () => {
    //         try {
    //             const [productivityResult] = await Promise.all([
    //                 dashboardService.GetProductivityDashboard(formatDateForAPI(date)),
    //                 //dashboardService.GetFormComments(formatDateForAPI(date))
    //             ]);
    //             setData(productivityResult);
    //             //setComments(commentsResult);
    //         } catch (error) {
    //             console.error('Error fetching dashboard data:', error);
    //         }
    //     };

    //     fetchData();
    // }, [date]);

    const handleDateChange = (newDate: Date | null) => {
        if (newDate)
            setDate(newDate);
        setSelectedLayer(null);
        setIsCalendarOpen(false);
    };

    // const handleLayerSelect = (layer: Layer | null | undefined) => {
    //     setSelectedLayer(layer);
    // };

    // const handleProductSelect = (product: number) => {
    //     setSelectedProduct(product);
    // };

    const changeDate = (days: number) => {
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + days);
        setDate(newDate);
        setSelectedLayer(null);
    };

    const formatDate = (dateObj: Date) => {
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return dateObj.toLocaleDateString(undefined, options);
    };

    const formatDateForAPI = (dateObj: Date) => {
        console.log(dateObj);
        const formatteddate = dateObj.toLocaleDateString('en-CA'); 
        console.log(formatteddate);
        return formatteddate;
    };
    
    return (
        <div className="container mx-auto  bg-gray-100 ">
            <div 
                className="bg-white  rounded-lg shadow-md p-2 mb-2">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => changeDate(-1)}
                        className="text-white bg-green-800 rounded-lg  p-2hover:text-[#124940] transition-colors duration-200"
                        aria-label="Previous day"
                    >
                        <ChevronLeft size={30} />
                    </button>
                    <div className="text-center flex-grow flex items-center justify-center">
                        <h1 className="text-xl font-bold text-green-800 mr-2">
                            {formatDate(date)}
                        </h1>
                        <button
                            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                            className="text-green-800 hover:text-[#124940] transition-colors duration-200"
                            aria-label="Open calendar"
                        >
                            <Calendar size={20} />
                        </button>
                        {isCalendarOpen && (
                            <div className="absolute mt-1 bg-white shadow-lg rounded-lg z-10">
                                <DatePicker
                                    selected={date}
                                    onChange={handleDateChange}
                                    inline
                                />
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => changeDate(1)}
                        className="text-white bg-green-800 rounded-lg  p-2hover:text-[#124940] transition-colors duration-200"
                        aria-label="Next day"
                    >
                        <ChevronRight size={30} />
                    </button>
                </div>
            </div>

            {/* Rest of the component remains the same */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2 bg-white p-4 rounded-lg shadow-lg">
                    <TargetsChart 
                        date={formatDateForAPI(date)} 
                        onLayerSelect={setSelectedLayer} 
                        onProductSelect={setSelectedProduct} 
                        onProductionRoleSelect={handleProductionRoleSelect}
                    />
                </div>
                    
                  <div className="md:col-span-2">
                    <LayerDetails 
                        productionRole={selectedProductionRole}
                        layer={selectedLayer} 
                        product={selectedProduct} 
                        date={formatDateForAPI(date)} 
                    />
                </div>
             
            </div>


                        {selectedProductionRole && selectedProduct && (
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
                <SupervisorTeamOverview  date={formatDateForAPI(date)} productionRole={selectedProductionRole} productId={selectedProduct} />
            </div>)}
        </div>
    );
};

export default DailyPage;