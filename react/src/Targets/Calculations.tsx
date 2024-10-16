/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Calculation, User, Layer, Remark,  Product } from '../types';
import { calculationService } from '../services/calculationService';
import { entityService } from '../services/entityService';
import axios from 'axios';

interface Props {
    user: User;
    calculations: Calculation[];
}

const Calculations: React.FC<Props> = ({ user, calculations }) => {
    const [editedCalculations, setEditedCalculations] = useState<Calculation[]>(calculations);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [selectedProduct, setSelectedProduct] = useState<number>(1);
    const [selectedLayer, setSelectedLayer] = useState<number | ''>('');
    const [newCalculation, setNewCalculation] = useState<Calculation>({
        calculationId: 0,
        layer: { id: 0, name: '' },
        remark: { id: 0, name: '' },
        valuePer8Hours: 0,
        valuePerHour: 0,
        product: { id: 0, name: '' },
        dailyHours: 9.5,
    });

    const [layers, setLayers] = useState<Layer[]>([]);
    const [remarks, setRemarks] = useState<Remark[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        fetchOptions();
    }, []);

    const fetchOptions = async () => {
        try {
            const [layersData, remarksData, productsData] = await Promise.all([
                entityService.getAllLayers(),
                entityService.getAllRemarks(),
                entityService.getAllProducts(),
            ]);
            setLayers(layersData);
            setRemarks(remarksData);
            setProducts(productsData);
        } catch (error) {
            console.error('Error fetching options:', error);
        }
    };


    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleSaveClick = async () => {
        try {
            await Promise.all(editedCalculations.map(calculation => 
                calculationService.updateCalculation(calculation.calculationId, calculation)
            ));
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving calculations:', error);
        }
    };

    const handleValueChange = (id: number, field: keyof Calculation, value: any) => {
        setEditedCalculations(prevCalculations => 
            prevCalculations.map(calculation => {
                if (calculation.calculationId === id) {
                    const updatedCalculation = { ...calculation, [field]: value };
                    if (field === 'valuePer8Hours') {
                        updatedCalculation.valuePerHour = value / calculation.dailyHours;
                    }
                    return updatedCalculation;
                }
                return calculation;
            })
        );
    };

    const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedProduct(Number(e.target.value));
    };

    const handleLayerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedLayer(e.target.value === '' ? '' : Number(e.target.value));
    };

    const handleNewCalculationChange = (field: keyof Calculation, value: any) => {
        setNewCalculation(prev => {
            const updated = { ...prev, [field]: value };
            if (field === 'valuePer8Hours') {
                updated.valuePerHour = value / (prev.dailyHours || 9.5);
            }
            return updated;
        });
    };

    const handleAddCalculation = async () => {
        if (
            newCalculation.product?.id &&
            newCalculation.layer?.id &&
            newCalculation.remark?.id &&
            typeof newCalculation.valuePer8Hours === 'number' &&
            typeof newCalculation.dailyHours === 'number'
        ) {
            const isDuplicate = editedCalculations.some(calculation =>
                calculation.product.id === newCalculation.product!.id &&
                calculation.layer.id === newCalculation.layer!.id &&
                calculation.remark.id === newCalculation.remark!.id
            );
    
            if (isDuplicate) {
                alert("A calculation with the same product, layer, remark already exists.");
                return;
            }
    
            try {
                const valuePerHour = typeof newCalculation.valuePerHour === 'number' 
                    ? newCalculation.valuePerHour 
                    : newCalculation.valuePer8Hours / newCalculation.dailyHours;
    
                const calculationToAdd: Calculation = {
                    calculationId: 0, 
                    layer: newCalculation.layer,
                    remark: newCalculation.remark,
                    product: newCalculation.product,
                    valuePer8Hours: newCalculation.valuePer8Hours,
                    valuePerHour: valuePerHour,
                    dailyHours: newCalculation.dailyHours
                };
                console.log('Payload being sent:', JSON.stringify(calculationToAdd));

                const addedCalculation = await calculationService.createCalculation(calculationToAdd);
                setEditedCalculations([...editedCalculations, addedCalculation]);
                setNewCalculation({
                    calculationId: 0,
                    layer: { id: 0, name: '' },
                    remark: { id: 0, name: '' },
                    valuePer8Hours: 0,
                    valuePerHour: 0,
                    product: { id: 0, name: '' },
                    dailyHours: 9.5,
                });
            } catch (error) {
                console.error('Error adding calculation:', error);
                if (axios.isAxiosError(error) && error.response) {
                    alert(`Error: ${error.response.data}`);
                } else {
                    alert('An unexpected error occurred');
                }
            }
        } else {
            alert("Please fill in all fields for the new calculation.");
        }
    };
    const selectedView = 'calculations';     
    const handleDeleteCalculation = async (id: number) => {
        try {
            await calculationService.deleteCalculation(id);
            setEditedCalculations(editedCalculations.filter(calculation => calculation.calculationId !== id));
        } catch (error) {
            console.error('Error deleting calculation:', error);
        }
    };

    const filteredCalculations = editedCalculations.filter((calculation) =>
        calculation.product.id === selectedProduct && (!selectedLayer || calculation.layer.id === selectedLayer)
    );

    const isAdminOrSuperadmin = user.role === 'admin' || user.role === 'superadmin';

    return (
        <div className="container ">
    
        {selectedView === 'calculations' && (

                <>
                    {isAdminOrSuperadmin && (
                        <div style={{ backgroundImage: `url(makanBackgroundDark.png)` }} className="mb-4 text-white p-4 rounded-lg">
                            <div className="grid text-gray-800 grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2">
                                <select
                                    value={newCalculation.product?.id || ''}
                                    onChange={(e) => handleNewCalculationChange('product', products.find(p => p.id === Number(e.target.value)))}
                                    className="w-full p-1  text-sm border rounded"
                                >
                                    <option value="" disabled>Select Product</option>
                                    {products.map((product) => (
                                        <option key={product.id} value={product.id}>{product.name}</option>
                                    ))}
                                </select>
                                <select
                                    value={newCalculation.layer?.id || ''}
                                    onChange={(e) => handleNewCalculationChange('layer', layers.find(l => l.id === Number(e.target.value)))}
                                    className="w-full p-1 text-sm border rounded"
                                >
                                    <option value="" disabled>Select Layer</option>
                                    {layers.map((layer) => (
                                        <option key={layer.id} value={layer.id}>{layer.name}</option>
                                    ))}
                                </select>
                                <select
                                    value={newCalculation.remark?.id || ''}
                                    onChange={(e) => handleNewCalculationChange('remark', remarks.find(r => r.id === Number(e.target.value)))}
                                    className="w-full p-1 text-sm border rounded"
                                >
                                    <option value="" disabled>Select Remark</option>
                                    {remarks.map((remark) => (
                                        <option key={remark.id} value={remark.id}>{remark.name}</option>
                                    ))}
                                </select>
                              
                                <input
                                    type="number"
                                    value={newCalculation.valuePer8Hours || ''}
                                    onChange={(e) => handleNewCalculationChange('valuePer8Hours', parseFloat(e.currentTarget.value))}
                                    placeholder="Productivity for 9.5 hours"
                                    className="w-full p-1 border rounded text-sm"
                                />
                                <button
                                    onClick={handleAddCalculation}
                                    className="px-2 py-1 bg-[#196A58] text-white rounded text-sm"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    )}

                    <div className='bg-gray-200 p-8 rounded-lg'>
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex mb-4 space-x-4">
                                <div className="flex-1">
                                    <label htmlFor="product" className="block text-sm font-medium mb-1">Product:</label>
                                    <select
                                        id="product"
                                        value={selectedProduct}
                                        onChange={handleProductChange}
                                        className="w-full p-1 text-sm border rounded"
                                    >
                                        {products.map((product) => (
                                            <option key={product.id} value={product.id}>{product.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-2">
                                    <label htmlFor="layer" className="block text-sm font-medium mb-1">Layer:</label>
                                    <select
                                        id="layer"
                                        value={selectedLayer}
                                        onChange={handleLayerChange}
                                        className="w-full p-1 text-sm border rounded"
                                    >
                                        <option value="">All Layers</option>
                                        {layers.map((layer) => (
                                            <option key={layer.id} value={layer.id}>{layer.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {isAdminOrSuperadmin && (
                                isEditing ? (
                                    <button
                                        onClick={handleSaveClick}
                                        className="px-4 py-2 bg-[#196A58] text-white rounded"
                                    >
                                        Save
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleEditClick}
                                        className="px-4 py-2 bg-[#196A58] text-lg text-white rounded"
                                    >
                                        Edit
                                    </button>
                                )
                            )}
                        </div>
                        <div className="overflow-auto table table-zebra">
                            <table className="min-w-full">
                                <thead className='border-b-2 border-slate-400'>
                                    <tr>
                                        <th className="py-2 px-4 border-b text-center">Layer</th>
                                        <th className="py-2 px-4 border-b text-center">Remark</th>
                                        <th className="py-2 px-4 border-b text-center">Productivity for 9.5 hours</th>
                                        <th className="py-2 px-4 border-b text-center">Hourly Value</th>
                                        {isAdminOrSuperadmin && <th className="py-2 px-4 border-b text-center"></th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCalculations.map((calculation) => (
                                        <tr key={calculation.calculationId}>
                                            <td className="py-2 px-4 border-b text-center">
                                                {isEditing ? (
                                                    <select
                                                        value={calculation.layer.id}
                                                        onChange={(e) =>
                                                            handleValueChange(calculation.calculationId, 'layer', layers.find(l => l.id === Number(e.target.value)))
                                                        }
                                                        className="w-full p-2 border rounded mb-2"
                                                    >
                                                        {layers.map((layer) => (
                                                            <option key={layer.id} value={layer.id}>{layer.name}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    calculation.layer.name
                                                )}
                                            </td>
                                            <td className="py-2 px-4 border-b text-center">
                                                {isEditing ? (
                                                    <select
                                                        value={calculation.remark.id}
                                                        onChange={(e) =>
                                                            handleValueChange(calculation.calculationId, 'remark', remarks.find(r => r.id === Number(e.target.value)))
                                                        }
                                                        className="w-full p-2 border rounded"
                                                    >
                                                        {remarks.map((remark) => (
                                                            <option key={remark.id} value={remark.id}>{remark.name}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    calculation.remark.name
                                                )}
                                            </td>
                                            <td className="py-2 px-4 border-b text-center">
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        value={calculation.valuePer8Hours}
                                                        onChange={(e) =>
                                                            handleValueChange(calculation.calculationId, 'valuePer8Hours', parseFloat(e.currentTarget.value))
                                                        }
                                                        className="w-full p-2 border rounded mb-2"
                                                    />
                                                ) : (
                                                    calculation.valuePer8Hours
                                                )}
                                            </td>
                                            <td className="py-2 px-4 border-b text-center">
                                                {calculation.valuePerHour.toFixed(2)}
                                            </td>
                                
                                            {isAdminOrSuperadmin && (
                                                <td className="py-2 px-4 border-b text-center">
                                                    <button
                                                        onClick={() => handleDeleteCalculation(calculation.calculationId)}
                                                        className="bg-transparent hover:bg-red-500 text-white font-bold py-2 px-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 stroke-black h-6" viewBox="0 0 24 24">
                                                            <g id="Trash" data-name="Trash">
                                                                <g>
                                                                    <path d="M19.45,4.06H15.27v-.5a1.5,1.5,0,0,0-1.5-1.5H10.23a1.5,1.5,0,0,0-1.5,1.5v.5H4.55a.5.5,0,0,0,0,1h.72l.42,14.45a2.493,2.493,0,0,0,2.5,2.43h7.62a2.493,2.493,0,0,0,2.5-2.43l.42-14.45h.72A.5.5,0,0,0,19.45,4.06Zm-9.72-.5a.5.5,0,0,1,.5-.5h3.54a.5.5,0,0,1,.5.5v.5H9.73Zm7.58,15.92a1.5,1.5,0,0,1-1.5,1.46H8.19a1.5,1.5,0,0,1-1.5-1.46L6.26,5.06H17.74Z" />
                                                                    <path d="M8.375,8h0a.5.5,0,0,1,1,0l.25,10a.5.5,0,0,1-1,0Z" />
                                                                    <path d="M15.625,8.007a.5.5,0,0,0-1,0h0l-.25,10a.5.5,0,0,0,1,0Z" />
                                                                </g>
                                                            </g>
                                                        </svg>
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Calculations;