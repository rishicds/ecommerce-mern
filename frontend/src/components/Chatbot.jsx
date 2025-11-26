import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";
import axios from "axios";
import { backendUrl } from "../config/shopConfig";
import { useShop } from "../context/ShopContex";

const Chatbot = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { cartDetails, cartItems } = useShop();

    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        { from: "bot", text: "Hello! How can I help you today?" }
    ]);
    const [unread, setUnread] = useState(0);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const messagesRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        // Auto-scroll so the newest message's top is visible
        if (!messagesRef.current) return;
        const container = messagesRef.current;
        // query the rendered message nodes (we add data-chat-msg on each message)
        const nodes = container.querySelectorAll('[data-chat-msg]');
        if (!nodes || nodes.length === 0) return;
        const last = nodes[nodes.length - 1];
        // scroll the last message into view at its start
        try {
            last.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (e) {
            // fallback: set container scrollTop to last offset
            container.scrollTop = last.offsetTop;
        }
    }, [messages]);

    useEffect(() => {
        if (open && inputRef.current) {
            try { inputRef.current.focus(); } catch (e) { /* ignore */ }
        }
    }, [open]);

    const push = (msg) => {
        setMessages((m) => {
            const next = [...m, msg];
            // if chat is closed and bot sent a message, increment unread
            if (msg.from === 'bot' && !open) {
                setUnread((u) => u + 1);
            }
            return next;
        });
    };

    const formatOrder = (o) => {
        const date = o.createdAt ? new Date(o.createdAt).toLocaleString() : '';
        const header = `Order — Status: ${o.status} — Total: $${(o.amount ?? 0).toFixed(2)}${date ? ` — ${date}` : ''}`;
        const addr = o.address ? `Ship to: ${o.address.street || ''} ${o.address.city || ''} ${o.address.state || ''} ${o.address.zip || ''}` : '';
        const items = (o.items || []).map(it => {
            const name = it.name || (it.productId && it.productId.name) || 'Item';
            const variant = it.variantSize ? ` (${it.variantSize})` : '';
            const qty = it.quantity || 0;
            const price = (it.price ?? (it.productId && it.productId.price) ?? 0);
            const status = it.status || '';
            return ` - ${name}${variant} x${qty} — $${Number(price * qty).toFixed(2)}${status ? ` — ${status}` : ''}`;
        }).join("\n");
        return `${header}${addr ? `\n${addr}` : ''}\nItems:\n${items}`;
    };

    const handleOpen = () => {
        // If user is not logged in, redirect to login first
        if (!user) {
            navigate("/login");
            return;
        }
        setOpen(true);
        setUnread(0);
    };

    const showOrders = async () => {
        if (!user) {
            push({ from: "bot", text: "Please login to view your orders." });
            return;
        }
        setLoading(true);
        push({ from: "bot", text: "Fetching your orders..." });
        try {
            const res = await axios.get(`${backendUrl}/api/order/userOrders`, { withCredentials: true });
            if (res.data?.success && res.data.orders && res.data.orders.length) {
                const list = res.data.orders.map(formatOrder).join('\n\n');
                push({ from: "bot", text: `I found the following orders:\n\n${list}` });
            } else {
                push({ from: "bot", text: "No orders found for your account." });
            }
        } catch (err) {
            console.error(err);
            push({ from: "bot", text: "Failed to fetch orders. Please try again later." });
        } finally {
            setLoading(false);
        }
    };

    const showCart = async () => {
        // Fetch current cart from backend to ensure it's in sync with cart page
        if (!user) {
            push({ from: "bot", text: "Please login to view your cart." });
            return;
        }
        setLoading(true);
        push({ from: "bot", text: "Fetching your cart..." });
        try {
            const res = await axios.get(`${backendUrl}/api/cart/get`, { withCredentials: true });
            if (res.data?.success && res.data.cartData) {
                const items = Array.isArray(res.data.cartData.items) ? res.data.cartData.items : [];
                if (!items.length) {
                    push({ from: "bot", text: "Your cart is empty." });
                } else {
                    const lines = items.map(it => {
                        const name = it.name || (it.productId && it.productId.name) || 'Item';
                        const qty = it.quantity || 0;
                        const price = (it.price ?? (it.productId && it.productId.price) ?? 0);
                        return `${name} x ${qty} — $${Number(price * qty).toFixed(2)}`;
                    });
                    push({ from: "bot", text: `Your cart:\n${lines.join("\n")}` });
                }
            } else {
                push({ from: "bot", text: "Your cart is empty." });
            }
        } catch (err) {
            console.error(err);
            push({ from: "bot", text: "Failed to fetch cart. Please try again later." });
        } finally {
            setLoading(false);
        }
    };

    const handleSupport = () => {
        const contact = `Email: Knightstvapeshop@gmail.com\nPhone: 6045597833`;
        push({ from: "bot", text: `Business hours:\n${businessHours}\n\n${contact}` });
    };

    const businessHours = `Monday - Thursday\n8AM - 10PM\nFriday - Saturday\n9AM - 12AM\nSunday\n9AM - 10PM`;

    const handleHours = () => {
        push({ from: "bot", text: `Business hours:\n${businessHours}` });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        push({ from: "user", text: input });

        // rule-based commands
        const text = input.trim().toLowerCase();
        setInput("");

        if (text.includes("order") || text.includes("orders")) {
            await showOrders();
            return;
        }

        if (text.includes("cart")) {
            showCart();
            return;
        }

        if (text.includes("support") || text.includes("help") || text.includes("contact") || text.includes("phone") || text.includes("email") || text.includes("call")) {
            handleSupport();
            return;
        }

        if (text.includes("hours") || text.includes("timings") || text.includes("time")) {
            handleHours();
            return;
        }

        // If input looks like an order id (24 hex chars) or email, try to filter user's orders
        if (user) {
            const isOrderId = /^[0-9a-fA-F]{24}$/.test(text);
            const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
            if (isOrderId || isEmail) {
                setLoading(true);
                try {
                    const res = await axios.get(`${backendUrl}/api/order/userOrders`, { withCredentials: true });
                    if (res.data?.success && res.data.orders) {
                        const matches = res.data.orders.filter(o => (isOrderId && o._id === text) || (isEmail && o.userId && o.userId.email === text));
                        if (matches.length) {
                            const out = matches.map(formatOrder).join('\n\n');
                            push({ from: "bot", text: `Found:\n\n${out}` });
                        } else {
                            push({ from: "bot", text: "No orders matched that query." });
                        }
                    } else {
                        push({ from: "bot", text: "No orders found for your account." });
                    }
                } catch (err) {
                    console.error(err);
                    push({ from: "bot", text: "Failed to fetch orders." });
                } finally {
                    setLoading(false);
                }
                return;
            }
        }

        // default reply
        push({ from: "bot", text: "Sorry, I didn't understand. Try: 'show my orders', 'show cart', or 'support'" });
    };

    return (
        <div>
            {/* Floating button */}
            {!open && (
                <button onClick={handleOpen} aria-label="Open chat" className="fixed right-6 bottom-6 rounded-full w-16 h-16 md:w-20 md:h-20 flex items-center justify-center shadow-xl hover:scale-105 transition-transform z-50 bg-gradient-to-br from-yellow-400 to-yellow-500">
                    {/* chat bubble SVG */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 md:w-8 md:h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4-.86L3 21l1.86-4.14A7.988 7.988 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {unread > 0 && (
                        <span className="absolute -top-1 -right-1 bg-black text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">{unread}</span>
                    )}
                </button>
            )}

            {open && (
                <div className="fixed right-6 bottom-6 w-[30rem] md:w-[34rem] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                            <div className="p-3 bg-black text-white flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">K</div>
                                <div className="flex-1">
                                    <div className="font-semibold">Support Chat</div>
                                    <div className="text-xs opacity-80">We're here to help</div>
                                </div>
                                <button onClick={() => setOpen(false)} className="text-sm opacity-80 px-2 py-1 bg-white/10 rounded">Close</button>
                            </div>

                            <div ref={messagesRef} className="p-3 h-80 overflow-auto bg-gray-50">
                                <div className="flex flex-col gap-3">
                                {messages.map((m, i) => (
                                    m.from === 'bot' ? (
                                        <div key={i} data-chat-msg className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs">K</div>
                                            <div className="max-w-[82%]">
                                                <div className="bg-white border border-gray-200 rounded-lg p-2 text-sm text-gray-800 shadow-sm">
                                                    <pre className="whitespace-pre-wrap">{m.text}</pre>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div key={i} data-chat-msg className="flex items-end">
                                            <div className="ml-auto max-w-[82%]">
                                                <div className="bg-black text-white rounded-lg p-2 text-sm">
                                                    <pre className="whitespace-pre-wrap">{m.text}</pre>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                ))}
                                </div>
                            </div>

                            <div className="p-3 border-t bg-white">
                                <form onSubmit={handleSubmit} className="flex gap-2 items-center">
                                    <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a command or order id" className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none" />
                                    <button type="submit" className="bg-black text-white px-3 rounded">Send</button>
                                </form>
                                <div className="mt-2 flex gap-2">
                                    <button onClick={showOrders} className="text-xs px-3 py-1 bg-white border rounded-full">Orders</button>
                                    <button onClick={showCart} className="text-xs px-3 py-1 bg-white border rounded-full">Cart</button>
                                    <button onClick={handleSupport} className="text-xs px-3 py-1 bg-white border rounded-full">Contact</button>
                                </div>
                            </div>
                </div>
            )}
        </div>
    );
};

export default Chatbot;
