import React, { useState, useEffect } from 'react';
import { Layer, Remark, Product } from '../types';
import { entityService } from '../services/entityService';

type EntityType = 'layer' | 'remark' | 'product';
type Entity = Layer | Remark  | Product;

const EntitiesManager: React.FC = () => {
    const [entities, setEntities] = useState<{
        layers: Layer[];
        remarks: Remark[];
        products: Product[];
    }>({
        layers: [],
        remarks: [],
        products: [],
    });

    const [newEntity, setNewEntity] = useState<Entity>({ id: 0, name: '' });
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentEntityType, setCurrentEntityType] = useState<EntityType>('layer');
    const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAllEntities();
    }, []);

    const fetchAllEntities = async () => {
        try {
            const [layers, remarks, products] = await Promise.all([
                entityService.getAllLayers(),
                entityService.getAllRemarks(),
                entityService.getAllProducts(),
            ]);
            setEntities({ layers, remarks, products });
        } catch (error) {
            alert("Failed to fetch entities. Please try again.");
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (editingEntity) {
            setEditingEntity({ ...editingEntity, name: e.target.value });
        } else {
            setNewEntity({ ...newEntity, name: e.target.value });
        }
    };

    const handleSave = async () => {
        try {
            let savedEntity: Layer | Remark  | Product;
            if (editingEntity) {
                switch (currentEntityType) {
                    case 'layer':
                        await entityService.updateLayer(editingEntity.id, editingEntity as Layer);
                        break;
                    case 'remark':
                        await entityService.updateRemark(editingEntity.id, editingEntity as Remark);
                        break;
                 
                    case 'product':
                        await entityService.updateProduct(editingEntity.id, editingEntity as Product);
                        break;
                }
                setEntities(prev => ({
                    ...prev,
                    [currentEntityType + 's']: prev[currentEntityType + 's' as keyof typeof prev].map(
                        entity => entity.id === editingEntity.id ? editingEntity : entity
                    )
                }));
                setEditingEntity(null);
            } else {
                switch (currentEntityType) {
                    case 'layer':
                        savedEntity = await entityService.createLayer(newEntity as Layer);
                        setEntities(prev => ({ ...prev, layers: [...prev.layers, savedEntity] }));
                        break;
                    case 'remark':
                        savedEntity = await entityService.createRemark(newEntity as Remark);
                        setEntities(prev => ({ ...prev, remarks: [...prev.remarks, savedEntity] }));
                        break;
              
                    case 'product':
                        savedEntity = await entityService.createProduct(newEntity as Product);
                        setEntities(prev => ({ ...prev, products: [...prev.products, savedEntity] }));
                        break;
                }
                setNewEntity({ id: 0, name: '' });
                setIsDialogOpen(false);
            }
            alert(`${currentEntityType} ${editingEntity ? 'updated' : 'created'} successfully.`);
        } catch (error) {
            alert(`Failed to ${editingEntity ? 'update' : 'create'} ${currentEntityType}. Please try again.`);
        }
    };

    const handleDelete = async (entityType: EntityType, id: number) => {
        try {
            switch (entityType) {
                case 'layer':
                    await entityService.deleteLayer(id);
                    setEntities(prev => ({ ...prev, layers: prev.layers.filter(layer => layer.id !== id) }));
                    break;
                case 'remark':
                    await entityService.deleteRemark(id);
                    setEntities(prev => ({ ...prev, remarks: prev.remarks.filter(remark => remark.id !== id) }));
                    break;
         
                case 'product':
                    await entityService.deleteProduct(id);
                    setEntities(prev => ({ ...prev, products: prev.products.filter(product => product.id !== id) }));
                    break;
            }
            alert(`${entityType} deleted successfully.`);
        } catch (error) {
            alert(`Failed to delete ${entityType}. Please try again.`);
        }
    };

    const filteredEntities = entities[`${currentEntityType}s` as keyof typeof entities].filter(
        entity => entity.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto ">
            <div className="bg-gray-200 p-8 rounded-lg">
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-center">
                    <div className="mb-4 sm:mb-0">
                        <nav className="flex space-x-4" aria-label="Tabs">
                            {['layer', 'remark', 'product'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setCurrentEntityType(tab as EntityType)}
                                    className={`${
                                        currentEntityType === tab
                                            ? 'bg-[#196A58] text-white'
                                            : 'text-[#196A58] hover:bg-[#e6f0ee]'
                                    } px-3 py-2 font-medium text-sm rounded-md transition-colors duration-200`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1) + 's'}
                                </button>
                            ))}
                        </nav>
                    </div>
                    <button
                        className="px-4 py-2 bg-[#196A58] text-white rounded hover:bg-[#124C3F] transition duration-300"
                        onClick={() => setIsDialogOpen(true)}
                    >
                        Add New {currentEntityType}
                    </button>
                </div>
    
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder={`Search ${currentEntityType}s...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#196A58] focus:border-[#196A58]"
                    />
                </div>
    
                <div className="overflow-auto table table-zebra">
                    <table className="min-w-full">
                        <thead className='border-b-2 border-slate-400'>
                            <tr>
                                <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEntities.map((entity) => (
                                <tr key={entity.id}>
                                    <td className="py-2 px-4 whitespace-nowrap text-sm text-gray-500">{entity.id}</td>
                                    <td className="py-2 px-4 whitespace-nowrap text-sm text-gray-900">
                                        {editingEntity && editingEntity.id === entity.id ? (
                                            <input
                                                type="text"
                                                value={editingEntity.name}
                                                onChange={handleInputChange}
                                                className="w-full p-1 text-sm border rounded focus:outline-none focus:ring-[#196A58] focus:border-[#196A58]"
                                            />
                                        ) : (
                                            entity.name
                                        )}
                                    </td>
                                    <td className="py-2 px-4 whitespace-nowrap text-sm font-medium">
                                        {editingEntity && editingEntity.id === entity.id ? (
                                            <>
                                                <button
                                                    className="text-[#196A58] hover:text-[#124C3F] mr-2"
                                                    onClick={handleSave}
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    className="text-gray-600 hover:text-gray-900"
                                                    onClick={() => setEditingEntity(null)}
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    className="text-[#196A58] hover:text-[#124C3F] mr-2"
                                                    onClick={() => setEditingEntity(entity)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="text-red-600 hover:text-red-900"
                                                    onClick={() => handleDelete(currentEntityType, entity.id)}
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
    
            {isDialogOpen && (
                <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                    Add New {currentEntityType}
                                </h3>
                                <div className="mt-2">
                                    <input
                                        type="text"
                                        placeholder={`Enter ${currentEntityType} name`}
                                        value={newEntity.name}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#196A58] focus:border-[#196A58] sm:text-sm"
                                    />
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#196A58] text-base font-medium text-white hover:bg-[#124C3F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#196A58] sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={handleSave}
                                >
                                    Save
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#196A58] sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setIsDialogOpen(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

};

export default EntitiesManager;