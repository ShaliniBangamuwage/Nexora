import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; 
import { CheckCircle, Download, AlertCircle } from 'lucide-react';
import { C, FONT } from '../../components/profile/profileTheme';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getAuthHeaders } from '../../services/firebase';
import API_BASE_URL from '../../config/api';

const UI_SETTINGS = {
    ICON_SIZE: 80,
    HOME_PATH: "/"
};

const SUCCESS_MESSAGES = {
    TITLE: "Order Successful!",
    BODY: "Your order has been placed successfully. We will send you a confirmation email shortly."
};

const Success = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const urlOrderId = queryParams.get('orderId');

    const [orderData, setOrderData] = useState(location.state?.orderData || null);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    // Trap the browser's Back button to prevent returning to PayHere/Checkout
    useEffect(() => {
        window.history.pushState(null, null, window.location.href);
        const handlePopState = () => {
            navigate('/customer', { replace: true });
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [navigate]);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!urlOrderId && !orderData) {
                setIsLoading(false);
                return;
            }
            if (!urlOrderId) {
                setIsLoading(false);
                return;
            }
            try {
                const res = await fetch(`${API_BASE_URL}/customer-orders/details/${encodeURIComponent(urlOrderId)}`, { headers: await getAuthHeaders() });
                if (res.ok) {
                    const data = await res.json();
                    if (data) {
                        setOrderData({
                            orderId: data.orderId,
                            totalAmount: data.totalAmount,
                            firstName: data.customerName?.split(' ')[0] || '',
                            lastName: data.customerName?.split(' ').slice(1).join(' ') || '',
                            houseNumber: data.address?.split(',')[0] || '',
                            laneStreet: data.address?.split(',').slice(1, -1).join(',') || '',
                            city: data.address?.split(',').slice(-1)[0] || '',
                            phone: data.phone,
                            email: data.email,
                            items: data.types || [],
                            paymentMethod: data.paymentMethod || 'online',
                            paymentStatus: data.paymentStatus || 'pending'
                        });
                    }
                } else {
                    if (!orderData) setFetchError("Could not verify order details from the server.");
                }
            } catch (err) {
                if (!orderData) setFetchError("Network error while verifying order.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrder();
    }, [urlOrderId]);

    const displayData = orderData || { 
        orderId: urlOrderId || 'N/A', 
        totalAmount: 0,
        firstName: 'Customer',
        items: [],
        paymentMethod: 'online'
    };

    const displayAmount = displayData.totalAmount;
    const isCOD = String(displayData.paymentMethod).toUpperCase() === 'COD';

    const downloadPDF = () => {
        const doc = new jsPDF('p', 'pt', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const marginLeft = 40;
        const marginTop = 40;

        // Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(32);
        doc.setTextColor(30, 58, 138); 
        doc.text("NEXORA", marginLeft, marginTop);

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.text("Electronics & Technology", marginLeft, marginTop + 16);
        doc.text("Colombo, Sri Lanka", marginLeft, marginTop + 28);
        doc.text(import.meta.env.VITE_STORE_EMAIL || "Customer Support", marginLeft, marginTop + 40);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(26);
        doc.setTextColor(15, 23, 42);
        doc.text("INVOICE", pageWidth - marginLeft, marginTop, { align: 'right' });

        doc.setFontSize(10);
        const detailsRight = pageWidth - marginLeft;
        const detailsLabelRight = pageWidth - marginLeft - 200; // Increased spacing to 200 to prevent overlap
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text("Invoice No:", detailsLabelRight, marginTop + 16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 58, 138);
        doc.text(`#${displayData.orderId}`, detailsRight, marginTop + 16, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text("Date:", detailsLabelRight, marginTop + 30);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`, detailsRight, marginTop + 30, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text("Gateway:", detailsLabelRight, marginTop + 44);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(isCOD ? 'Cash on Delivery' : 'PayHere Secure', detailsRight, marginTop + 44, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text("Status:", detailsLabelRight, marginTop + 58);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(isCOD ? 234 : 22, isCOD ? 88 : 163, isCOD ? 12 : 74);
        doc.text(isCOD ? 'UNPAID' : 'PAID', detailsRight, marginTop + 58, { align: 'right' });

        // Line
        doc.setDrawColor(30, 58, 138);
        doc.setLineWidth(1.5);
        doc.line(marginLeft, marginTop + 74, pageWidth - marginLeft, marginTop + 74);

        // Bill To
        let currentY = marginTop + 100;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text("BILL TO", marginLeft, currentY);
        
        currentY += 18; // Increased spacing
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 58, 138);
        const fullName = `${displayData.firstName || ''} ${displayData.lastName || ''}`.trim();
        doc.text(fullName, marginLeft, currentY);
        
        currentY += 16; // Increased spacing
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        if (displayData.houseNumber || displayData.laneStreet) {
            const hNumber = (displayData.houseNumber || '').trim();
            const lStreet = (displayData.laneStreet || '').trim();
            doc.text(`${hNumber}${hNumber && lStreet ? ', ' : ''}${lStreet}`, marginLeft, currentY);
            currentY += 14; // Increased spacing
        }
        if (displayData.city) {
            doc.text((displayData.city || '').trim(), marginLeft, currentY);
            currentY += 14; // Increased spacing
        }
        if (displayData.phone) {
            doc.text(`Tel: ${(displayData.phone || '').trim()}`, marginLeft, currentY);
            currentY += 14; // Increased spacing
        }
        if (displayData.email) {
            doc.text(`Email: ${(displayData.email || '').trim()}`, marginLeft, currentY);
            currentY += 18;
        }

        // Table Data (3 Columns)
        const tableBody = [];
        if (displayData.items && displayData.items.length > 0) {
            displayData.items.forEach(item => {
                const q = item.qty || item.quantity || 1;
                const p = item.price || (item.total / q) || 0;
                const itemTotal = p * q;
                tableBody.push([
                    item.name,
                    `${q}`,
                    `Rs. ${itemTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                ]);
            });
        } else {
            tableBody.push([
                "Electronics Order Items",
                "1",
                `Rs. ${(displayAmount - 400).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
            ]);
        }

        autoTable(doc, {
            startY: currentY,
            head: [['DESCRIPTION', 'QTY', 'AMOUNT']],
            body: tableBody,
            theme: 'plain',
            headStyles: {
                fillColor: [30, 58, 138],
                textColor: 255,
                fontSize: 10,
                fontStyle: 'bold',
                halign: 'left',
                cellPadding: 10
            },
            columnStyles: {
                0: { halign: 'left', cellPadding: 12, fontStyle: 'bold' },
                1: { halign: 'center', cellPadding: 12, cellWidth: 60, textColor: [100, 116, 139] },
                2: { halign: 'right', cellPadding: 12, fontStyle: 'bold', textColor: [30, 58, 138], cellWidth: 100 },
            },
            bodyStyles: {
                fontSize: 10,
                textColor: [15, 23, 42],
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252],
            },
            margin: { left: marginLeft, right: marginLeft },
            didParseCell: (data) => {
                if (data.section === 'head') {
                    if (data.column.index === 1) data.cell.styles.halign = 'center';
                    if (data.column.index === 2) data.cell.styles.halign = 'right';
                }
            }
        });

        currentY = doc.lastAutoTable.finalY + 10;

        // Combined Totals table - pushed to the right and pageBreak: 'avoid'
        autoTable(doc, {
            startY: currentY,
            pageBreak: 'avoid',
            body: [
                ['Subtotal', `Rs. ${Number(displayData.subtotal ?? (displayAmount - Number(displayData.shippingFee ?? 400))).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
                ['Shipping Charge', `Rs. ${Number(displayData.shippingFee ?? 400).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
                ['Tax (0%)', 'Rs. 0.00'],
                ['Total Amount', `Rs. ${Number(displayAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`]
            ],
            theme: 'plain',
            columnStyles: {
                0: { halign: 'right', textColor: [100, 116, 139], fontStyle: 'bold', cellPadding: 8 },
                1: { halign: 'right', textColor: [51, 65, 85], fontStyle: 'bold', cellPadding: 8 }
            },
            margin: { left: pageWidth - 320, right: marginLeft }, // Pulls table to the right
            didParseCell: (data) => {
                if (data.row.index === 3) { // Total row
                    if (data.column.index === 0) {
                        data.cell.styles.textColor = [15, 23, 42];
                        data.cell.styles.fontSize = 12;
                        data.cell.styles.cellPadding = { top: 16, bottom: 16, left: 8, right: 8 };
                    } else if (data.column.index === 1) {
                        data.cell.styles.textColor = [30, 58, 138];
                        data.cell.styles.fontSize = 16;
                        data.cell.styles.cellPadding = { top: 16, bottom: 16, left: 8, right: 8 };
                    }
                }
            },
            didDrawCell: (data) => {
                if (data.row.index === 3 && data.section === 'body') {
                    doc.setDrawColor(226, 232, 240);
                    doc.setLineWidth(1.5);
                    doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
                }
            }
        });
        
        currentY = doc.lastAutoTable.finalY + 40;

        // Check if there's enough space for terms and conditions (need ~100pts)
        if (currentY + 100 > pageHeight - 60) {
            doc.addPage();
            currentY = marginTop; // reset to top of new page
        }

        // Terms and conditions
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text("TERMS & CONDITIONS", marginLeft, currentY);
        
        currentY += 15;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text("1. Returns are subject to the terms associated with your order.", marginLeft, currentY);
        currentY += 12;
        doc.text("2. All prices shown are inclusive of applicable taxes.", marginLeft, currentY);
        currentY += 12;
        doc.text("3. For support or discrepancies, please contact us within 24 hours of delivery.", marginLeft, currentY);

        currentY += 45;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 58, 138);
        doc.text("Thank You for Your Business!", pageWidth / 2, currentY, { align: 'center' });
        
        currentY += 15;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text("If you have any questions concerning this invoice, please contact our support team.", pageWidth / 2, currentY, { align: 'center' });

        // Add Footers to all pages at the very end
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setTextColor(148, 163, 184);
            doc.setFont('helvetica', 'normal');
            doc.text("Generated automatically by NEXORA", marginLeft, pageHeight - 30);
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - marginLeft, pageHeight - 30, { align: 'right' });
            
            // Add a subtle border line at the footer
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(1);
            doc.line(marginLeft, pageHeight - 45, pageWidth - marginLeft, pageHeight - 45);
        }

        doc.save(`NEXORA_Invoice_${displayData.orderId || Date.now()}.pdf`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (fetchError && !orderData) {
        return (
            <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6">
                <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-lg text-center flex flex-col items-center">
                    <AlertCircle size={60} className="text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Order Information Unavailable</h2>
                    <p className="text-slate-500 mb-8">{fetchError}</p>
                    <Link to="/customer" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors">
                        Return Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: C.bg, fontFamily: FONT.body }}>
            <main className="max-w-md w-full p-10 rounded-2xl border text-center" style={{ background: C.surface, borderColor: C.border, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>

                {/* === ON-SCREEN UI === */}
                <div style={{ padding: '20px', fontFamily: FONT.body }}>
                    <div style={{ textAlign: 'center', margin: '20px 0' }}>
                        <CheckCircle size={60} color="#22c55e" style={{ margin: '0 auto' }} />
                        <h2 style={{ color: C.textPrimary, fontSize: '24px', marginTop: '16px', fontWeight: '900' }}>Order Successful!</h2>
                        <p style={{ color: C.textMuted, fontSize: '14px', marginTop: '8px' }}>
                            {isCOD ? "Your order has been placed successfully. Please pay at the time of delivery." : "Your payment was processed successfully."}
                        </p>
                        <p style={{ color: C.textPrimary, fontSize: '16px', marginTop: '8px', fontWeight: '600' }}>Order #{displayData.orderId}</p>
                    </div>
                </div>

                <button
                    onClick={downloadPDF}
                    className="flex items-center justify-center gap-2 w-full mb-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-[13px] rounded-xl text-[12px] uppercase tracking-wider transition-all"
                >
                    <Download size={16} />
                    Download PDF Invoice
                </button>

                <Link to="/customer" replace className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-[13px] rounded-xl text-[12px] uppercase tracking-wider transition-all">
                    Back to Home
                </Link>
            </main>
        </div>
    );
};

export default Success;