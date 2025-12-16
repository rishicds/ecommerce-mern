
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useSync } from '../context/SyncContext';

const Variants = () => {
    const [itemGroups, setItemGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const { runSyncFrom, syncFromStatus } = useSync();

    const fetchItemGroups = async () => {
        try {
            setLoading(true);
            const backend = import.meta.env.VITE_BACKEND_URL;
            const res = await axios.get(`${backend}/api/admin/item-groups`, { withCredentials: true });
            if (res.data.success) {
                setItemGroups(res.data.itemGroups);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to fetch item groups');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItemGroups();
    }, [syncFromStatus]); // Refresh when sync status changes

    const handleSync = async () => {
        await runSyncFrom();
        fetchItemGroups();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl">Item Groups (Variants)</h2>
                <button
                    onClick={handleSync}
                    disabled={syncFromStatus === 'working'}
                    className="bg-[#FFB81C] text-white px-4 py-2 rounded-md disabled:opacity-50"
                >
                    {syncFromStatus === 'working' ? 'Syncing...' : 'Sync from Clover'}
                </button>
            </div>

            <div className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 font-medium grid grid-cols-12 gap-4">
                    <div className="col-span-4">Group Name</div>
                    <div className="col-span-4">Clover ID</div>
                    <div className="col-span-4 text-left">Attributes</div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : itemGroups.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No item groups found. Sync from Clover to populate.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {itemGroups.map((group) => (
                            <div key={group._id} className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50">
                                <div className="col-span-4 font-medium">{group.name}</div>
                                <div className="col-span-4 text-xs text-gray-500 font-mono">{group.cloverGroupId}</div>
                                <div className="col-span-4">
                                    {group.attributes && group.attributes.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {group.attributes.map((attr, idx) => (
                                                <span key={idx} className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs border border-blue-100">
                                                    {attr}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-xs">No attributes</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-8">
                <h3 className="text-lg mb-2">Note</h3>
                <p className="text-sm text-gray-500">
                    These Item Groups define the structure of variants (e.g. Size, Color) for your products in Clover.
                    Syncing from Clover will update this list.
                </p>
            </div>
        </div>
    );
};

export default Variants;
