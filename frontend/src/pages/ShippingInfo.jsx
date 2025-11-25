import React from 'react';
import { Link } from 'react-router';

const ShippingInfo = () => {
    return (
        <div className="px-4 sm:px-[5%] md:px-[7%] lg:px-[9%] py-8">
            <div className="max-w-4xl mx-auto text-gray-800">
                <h1 className="text-2xl font-bold mb-4">Shipping Update — Canada Post Strike</h1>

                <p className="mb-4">⚠️ Due to a labour disruption at Canada Post, some shipments may experience delays or routing changes. We are actively working with alternate carriers to minimize the impact and to get packages moving as quickly as possible.</p>

                <h2 className="text-xl font-semibold mt-4">What this means for your order</h2>
                <ul className="list-disc pl-5 mt-2 mb-4">
                    <li>Some packages that would normally be handled by Canada Post may be re-routed to alternate carriers (e.g. Purolator, UPS, FedEx).</li>
                    <li>Delivery times may be extended depending on destination and carrier availability.</li>
                    <li>Tracking updates may be delayed or show alternate carrier info once re-routed.</li>
                </ul>

                <h2 className="text-xl font-semibold mt-4">What we are doing</h2>
                <ul className="list-disc pl-5 mt-2 mb-4">
                    <li>Using alternate carriers where possible to keep shipments moving.</li>
                    <li>Monitoring all affected orders and proactively contacting customers when there is an impact.</li>
                    <li>Offering support and refunds for lost or significantly delayed packages when applicable.</li>
                </ul>

                <h2 className="text-xl font-semibold mt-4">How to check your order</h2>
                <p className="mb-4">Visit your <Link to="/orders" className="underline font-semibold text-[#FFB81C]">Orders</Link> page to view tracking updates. If tracking is not updating or shows an issue, please contact our support team and we will investigate.</p>

                <h2 className="text-xl font-semibold mt-4">Questions or concerns?</h2>
                <p className="mb-4">Email us at <a href="mailto:Knightstvapeshop@gmail.com" className="underline">Knightstvapeshop@gmail.com</a> or reply to your order confirmation and we'll respond as soon as possible.</p>

                <div className="mt-8">
                    <Link to="/" className="inline-block bg-[#FFB81C] text-white px-4 py-2 rounded">Back to Home</Link>
                </div>
            </div>
        </div>
    );
}

export default ShippingInfo;
