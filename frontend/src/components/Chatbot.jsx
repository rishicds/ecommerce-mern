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
    const [viewportHeight, setViewportHeight] = useState(null);

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

    // Adjust chat height on mobile when on-screen keyboard appears (visualViewport)
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const updateViewport = () => {
            try {
                const isMobile = window.matchMedia && window.matchMedia('(max-width: 767px)').matches;
                if (isMobile && window.visualViewport) {
                    setViewportHeight(window.visualViewport.height);
                } else {
                    setViewportHeight(null);
                }
            } catch (e) {
                setViewportHeight(null);
            }
        };

        updateViewport();
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', updateViewport);
            window.visualViewport.addEventListener('scroll', updateViewport);
        }
        window.addEventListener('resize', updateViewport);

        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', updateViewport);
                window.visualViewport.removeEventListener('scroll', updateViewport);
            }
            window.removeEventListener('resize', updateViewport);
        };
    }, []);

    // When viewportHeight changes (keyboard appears), ensure messages scroll so input is visible
    useEffect(() => {
        if (!messagesRef.current) return;
        const container = messagesRef.current;
        // small timeout to allow layout to update when keyboard opens
        const t = setTimeout(() => {
            const nodes = container.querySelectorAll('[data-chat-msg]');
            if (nodes && nodes.length) {
                const last = nodes[nodes.length - 1];
                try { last.scrollIntoView({ behavior: 'smooth', block: 'end' }); } catch (e) { container.scrollTop = container.scrollHeight; }
            } else {
                container.scrollTop = container.scrollHeight;
            }
        }, 80);
        return () => clearTimeout(t);
    }, [viewportHeight]);

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
            const variant = it.variantSize && it.variantSize !== 'default' ? ` (${it.variantSize})` : '';
            const qty = it.quantity || 0;
            const price = (it.price ?? (it.productId && it.productId.price) ?? 0);
            const status = it.status || '';
            return ` - ${name}${variant} Qty: ${qty} — $${Number(price * qty).toFixed(2)}${status ? ` — ${status}` : ''}`;
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
                // Only show orders that are not delivered
                const activeOrders = res.data.orders.filter(o => ((o.status || '').toString().toLowerCase() !== 'delivered'));
                if (activeOrders.length) {
                    // Push structured orders message so we can render images and bold headings
                    push({ from: 'bot', type: 'orders', heading: 'I found the following active orders:', orders: activeOrders });
                } else {
                    push({ from: 'bot', text: 'No active (undelivered) orders found for your account.' });
                }
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
                    // Build structured cart message including images so chat can render thumbnails
                    const structuredItems = items.map(it => {
                        const name = it.name || (it.productId && it.productId.name) || 'Item';
                        const qty = it.quantity || 0;
                        const price = (it.price ?? (it.productId && it.productId.price) ?? 0);
                        const image = it.image || (it.productId && it.productId.images && it.productId.images[0] && it.productId.images[0].url) || null;
                        const variant = it.variantSize || it.size || '';
                        return { name, qty, price, image, variant };
                    });

                    push({ from: 'bot', type: 'cart', heading: 'Your cart:', items: structuredItems });
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
        const contact = `📧 Email: Knightstvapeshop@gmail.com\n📞 Phone: 6045597833`;
        push({ from: "bot", text: `Need help? We're here!\n\n⏰ Business hours:\n${businessHours}\n\n${contact}` });
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
        // If user asks about available commands or how to use the chat, show the three supported commands.
        const asksForCommands = (t) => {
            if (!t) return false;
            // common phrasings: "what can i do", "what commands", "how to use", "what all can i do", "list commands"
            const re = /(what\s+(can|all)\s+(i\s+)?(do|ask|use)|what\s+are\s+(the\s+)?commands|list\s+commands|show\s+commands|how\s+do\s+i\s+(use|ask|operate)|how\s+to\s+use\s+the\s+chat|available\s+commands|what\s+can\s+i\s+ask|what\s+can\s+you\s+do)/i;
            return re.test(t);
        };

        // If user asks how to contact the shop / report an issue, respond with contact details
        const asksForContact = (t) => {
            if (!t) return false;
            // include defect/defective/broken/damaged/not working/faulty phrases
            const re = /(reach\s+out|how\s+to\s+reach|contact\s+(the\s+)?(shop|support|knight\s*st\.?|knight\s*st\s*vape|knight\s*st\s*vapes)|report\s+(an\s+)?issue|tell\s+(an\s+)?issue|i\s+want\s+to\s+reach\s+out|complain|file\s+a\s+complaint|get\s+in\s+touch|reach\s+knight|defect|defective|broken|damaged|not\s+working|not\s+work|faulty|leak|leaking)/i;
            return re.test(t);
        };

        if (asksForCommands(input)) {
            push({ from: 'bot', text: `You can use these quick commands:\n\n1) show my orders — View your recent and active orders (status, totals, items).\n2) show cart — View items currently in your cart (with thumbnails and quantities).\n3) support — Contact support (email & phone) or get help.` });
            setInput('');
            return;
        }

        if (asksForContact(input)) {
            // reuse existing support handler which pushes business hours and contact
            handleSupport();
            setInput('');
            return;
        }
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
                        // filter out delivered orders first
                        const available = res.data.orders.filter(o => ((o.status || '').toString().toLowerCase() !== 'delivered'));
                        const matches = available.filter(o => (isOrderId && o._id === text) || (isEmail && o.userId && o.userId.email === text));
                        if (matches.length) {
                            // push structured message for matches so images/headings render
                            push({ from: 'bot', type: 'orders', heading: 'Found matching active orders:', orders: matches });
                        } else {
                            push({ from: "bot", text: "No active (undelivered) orders matched that query." });
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
                <div style={viewportHeight ? { height: `${viewportHeight}px` } : undefined} className="fixed inset-0 md:inset-auto md:right-6 md:bottom-6 md:left-auto md:w-[34rem] bg-white border border-gray-200 md:rounded-lg shadow-lg overflow-hidden z-50 md:h-[80vh] flex flex-col">
                            <div className="p-3 bg-black text-white flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">K</div>
                                <div className="flex-1">
                                    <div className="font-semibold">Support Chat</div>
                                    <div className="text-xs opacity-80">We're here to help</div>
                                </div>
                                <button onClick={() => setOpen(false)} className="text-sm opacity-80 px-2 py-1 bg-white/10 rounded">Close</button>
                            </div>

                            <div ref={messagesRef} className="p-3 flex-1 overflow-auto bg-gray-50">
                                <div className="flex flex-col gap-3">
                                                        {messages.map((m, i) => (
                                                            m.from === 'bot' ? (
                                                                <div key={i} data-chat-msg className="flex items-start gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs">K</div>
                                                                    <div className="max-w-[82%]">
                                                                        <div className="bg-white border border-gray-200 rounded-lg p-2 text-base text-gray-800 shadow-sm">
                                                                            {/* If message contains structured orders, render nicely with bold headings and images */}
                                                                            {m.type === 'orders' && Array.isArray(m.orders) ? (
                                                                                <div>
                                                                                    {m.heading && <div className="font-bold mb-2">{m.heading}</div>}
                                                                                    <div className="space-y-4">
                                                                                        {m.orders.map((o) => (
                                                                                                    <div key={o._id} className="border rounded-lg p-4 bg-gray-50 shadow-sm">
                                                                                                        <div className="font-bold text-lg">{`Order — Status: ${o.status || 'N/A'} — Total: $${(o.amount ?? 0).toFixed(2)}${o.createdAt ? ` — ${new Date(o.createdAt).toLocaleString()}` : ''}`}</div>
                                                                                                        {o.address && (
                                                                                                            <div className="text-sm text-gray-600 mt-1">{`Ship to: ${o.address.street || ''} ${o.address.city || ''} ${o.address.state || ''} ${o.address.zip || ''}`}</div>
                                                                                                        )}
                                                                                                        <div className="mt-3 space-y-3">
                                                                                                            {(o.items || []).map((it, idx) => {
                                                                                                                const name = it.name || (it.productId && it.productId.name) || 'Item';
                                                                                                                const variant = it.variantSize || it.size || '';
                                                                                                                const qty = it.quantity || 0;
                                                                                                                const price = (it.price ?? (it.productId && it.productId.price) ?? 0);
                                                                                                                // try to find image from item or populated productId
                                                                                                                const imageUrl = it.image || (it.productId && it.productId.images && it.productId.images[0] && it.productId.images[0].url) || null;
                                                                                                                return (
                                                                                                                    <div key={idx} className="flex items-center gap-4">
                                                                                                                        <div className="w-16 h-16 shrink-0 rounded overflow-hidden bg-white border">
                                                                                                                            {imageUrl ? (
                                                                                                                                <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                                                                                                                            ) : (
                                                                                                                                <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">No image</div>
                                                                                                                            )}
                                                                                                                        </div>
                                                                                                                        <div className="flex-1 text-sm">
                                                                                                                            <div className="font-semibold text-base">{name}{(variant && variant !== 'default') ? <span className="text-sm text-gray-600"> {`(${variant})`}</span> : null}</div>
                                                                                                                            <div className="text-gray-600 text-sm">{`Qty: ${qty} — $${Number(price * qty).toFixed(2)}`}{it.status ? ` — ${it.status}` : ''}</div>
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                );
                                                                                                            })}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                ))}
                                                                                    </div>
                                                                                </div>
                                                                            ) : m.type === 'cart' && Array.isArray(m.items) ? (
                                                                                <div>
                                                                                    {m.heading && <div className="font-bold mb-2">{m.heading}</div>}
                                                                                    <div className="space-y-3">
                                                                                        {m.items.map((it, idx) => (
                                                                                            <div key={idx} className="flex items-center gap-4 border rounded p-3 bg-white">
                                                                                                <div className="w-16 h-16 shrink-0 rounded overflow-hidden bg-white border">
                                                                                                    {it.image ? (
                                                                                                        <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                                                                                                    ) : (
                                                                                                        <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">No image</div>
                                                                                                    )}
                                                                                                </div>
                                                                                                <div className="flex-1 text-sm">
                                                                                                    <div className="font-semibold text-base">{it.name}{(it.variant && it.variant !== 'default') ? <span className="text-sm text-gray-600"> {`(${it.variant})`}</span> : null}</div>
                                                                                                    <div className="text-gray-600 text-sm">{`Qty: ${it.qty} — $${Number(it.price * it.qty).toFixed(2)}`}</div>
                                                                                                </div>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <pre className="whitespace-pre-wrap">{m.text}</pre>
                                                                            )}
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
                                <form onSubmit={handleSubmit} className="flex gap-2 items-center flex-col sm:flex-row">
                                    <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a command or order id" className="w-full sm:flex-1 border rounded px-3 py-2 text-sm focus:outline-none" />
                                    <button type="submit" className="w-full sm:w-auto bg-black text-white px-3 rounded">Send</button>
                                </form>
                                <div className="mt-2 flex gap-2 flex-wrap">
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
