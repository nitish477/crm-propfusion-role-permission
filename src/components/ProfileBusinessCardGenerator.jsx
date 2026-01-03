import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { getStaff } from "../services/apiStaff";
import { fetchCurrentLoggedInUserAllData } from "../services/apiAllData";
import BusinessCard from "./BusinessCard";
import BusinessCardPDFDocument from "./BusinessCardPDFDocument";
import NewBusinessCard from "./NewBusinessCard";
import NewBusinessCardPDFDocument from "./NewBusinessCardPDFDocument";
import { prepareCardDataForPDF } from "../utils/pdfUtils";
import toast from "react-hot-toast";
import { pdf } from "@react-pdf/renderer";
import { toPng } from "html-to-image";

const ProfileBusinessCardGenerator = ({ currentUser, colorCode, isLuxury = false }) => {
    const [cardData, setCardData] = useState(null);
    const [showDialog, setShowDialog] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentSide, setCurrentSide] = useState("front");
    const [isFlipping, setIsFlipping] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [cardType, setCardType] = useState("old"); // "old" or "new"
    const cardRef = useRef();
    const frontRef = useRef();
    const backRef = useRef();

    // Touch/swipe handling
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const [lastTap, setLastTap] = useState(0);

    const fetchData = async () => {
        console.log("Business card button clicked!", { currentUser, colorCode, isLuxury });
        
        if (!currentUser?.id) {
            toast.error("User ID not found. Please try logging in again.");
            return;
        }

        setLoading(true);
        try {
            console.log("Starting data fetch for business card...");
            // Fetch agent data and company data in parallel using existing API services
            const [agent, allData] = await Promise.all([
                getStaff(currentUser.id),
                fetchCurrentLoggedInUserAllData(),
            ]);
            console.log("Data fetched successfully:", { agent, allData });
            const company = allData?.company_settings || {};

            // Prepare card data with fallbacks (removed role, address, company_tagline)
            const safe = (v, fb = "") => (v === null || v === undefined || v === "null" ? fb : v);
            const cardData = {
                id: currentUser?.id || agent?.id,
                name: safe(agent?.name, "Admin"),
                email: safe(agent?.email, "user@example.com"),
                phone: safe(agent?.phone, "+91 00000 00000"),
                website: safe(company?.crm_url, safe(company?.website, "example.com")),
                company_name: safe(company?.company_name, "Your Company"),
                company_logo_url: safe(company?.company_logo_url, ""),
                job_type: safe(agent?.job_type, ""),
                address: safe(company?.address, safe(agent?.address, "Hotel Seven Seas, Al-Nahada-1, Dubai")),
            };
            
            console.log("Card data prepared:", cardData);
            console.log("Agent name specifically:", agent?.name);


            setCardData(cardData);
            setShowDialog(true);
            console.log("Business card data set and dialog should open:", cardData);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error(
                "Failed to fetch data for business card. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        console.log("PDF download initiated", { cardData, frontRef: frontRef.current, backRef: backRef.current });
        if (!cardData) {
            console.error("No card data available for PDF generation");
            toast.error("No card data available for PDF generation");
            return;
        }

        try {
            setIsDownloading(true);
            toast.loading("Preparing PDF...", { id: "pdf-loading" });

            // Prepare card data with converted images
            const preparedData = await prepareCardDataForPDF({ ...cardData, themeColor: colorCode });

            // Capture front/back previews as images for exact-match PDF
            const toPngOptions = { pixelRatio: 3, cacheBust: true, backgroundColor: '#ffffff' };
            const [frontImg, backImg] = await Promise.all([
                toPng(frontRef.current, toPngOptions),
                toPng(backRef.current, toPngOptions),
            ]);

            // Generate PDF using captured images - use appropriate component based on card type
            const PDFComponent = cardType === "new" ? NewBusinessCardPDFDocument : BusinessCardPDFDocument;
            const blob = await pdf(
                <PDFComponent data={{ ...preparedData, frontImg, backImg }} />
            ).toBlob();

            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            const cardTypeLabel = cardType === "new" ? "modern" : "classic";
            link.download = `business-card-${cardTypeLabel}-a4.pdf`;
            document.body.appendChild(link);
            console.log("Triggering download...");
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success("Business card PDF downloaded successfully!", {
                id: "pdf-loading",
            });
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Failed to download PDF. Please try again.", {
                id: "pdf-loading",
            });
        }
        finally {
            setIsDownloading(false);
        }
    };

    const handleCloseDialog = () => {
        setShowDialog(false);
        setCardData(null);
        setCurrentSide("front");
        setCardType("old"); // Reset to old card type
    };

    const toggleSide = () => {
        if (isFlipping) return;
        setIsFlipping(true);
        setCurrentSide(currentSide === "front" ? "back" : "front");
        setTimeout(() => setIsFlipping(false), 600);
    };

    // Double tap handling
    const handleDoubleTap = () => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (now - lastTap < DOUBLE_TAP_DELAY) {
            toggleSide();
        }
        setLastTap(now);
    };

    // Swipe handling
    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && currentSide === "front") {
            toggleSide();
        } else if (isRightSwipe && currentSide === "back") {
            toggleSide();
        }
    };

    console.log("ProfileBusinessCardGenerator rendering", { currentUser, colorCode, isLuxury, loading });
    
    return (
        <div>
            {/* Generate Business Card Button */}
            <div className="profileActions" style={{ 
                marginTop: isLuxury ? "0" : "16px",
                position: "relative",
                zIndex: 10,
                pointerEvents: "auto"
            }}>
                <button
                    style={{
                        background: isLuxury ? "rgba(255, 255, 255, 0.2)" : colorCode,
                        backdropFilter: isLuxury ? "blur(10px)" : "none",
                        border: isLuxury ? "1px solid rgba(255, 255, 255, 0.3)" : "none",
                        width: "100%",
                        padding: isLuxury ? "0.8rem 1.5rem" : "12px",
                        borderRadius: isLuxury ? "12px" : "5px",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: isLuxury ? "0.95rem" : "16px",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        position: "relative",
                        overflow: "hidden",
                        minHeight: "40px", // Ensure minimum height
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                        zIndex: 10,
                        pointerEvents: "auto",
                    }}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("Button clicked!", e);
                        console.log("Current user:", currentUser);
                        console.log("Color code:", colorCode);
                        console.log("Is luxury:", isLuxury);
                        fetchData();
                    }}
                    disabled={loading}
                    onMouseEnter={(e) => {
                        if (!isLuxury) {
                            e.target.style.transform = "translateY(-2px)";
                            e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
                        } else {
                            e.target.style.transform = "translateY(-2px)";
                            e.target.style.background = "rgba(255, 255, 255, 0.3)";
                            e.target.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)";
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.background = isLuxury ? "rgba(255, 255, 255, 0.2)" : colorCode;
                        e.target.style.boxShadow = "none";
                    }}
                >
                    {loading ? "Generating..." : "Generate Business Card"}
                </button>
            </div>

            {/* Business Card Modal */}
            {showDialog && cardData && createPortal(
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        background: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 99999,
                        backdropFilter: "blur(4px)",
                    }}
                >
                    <div
                        style={{
                            background: "#fff",
                            padding: "32px",
                            borderRadius: "16px",
                            minWidth: "750px",
                            maxWidth: "95vw",
                            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                            position: "relative",
                            overflow: "hidden",
                            zIndex: 100000,
                        }}
                    >
                        {/* Close button */}
                        <button
                            onClick={handleCloseDialog}
                            style={{
                                position: "absolute",
                                top: "16px",
                                right: "16px",
                                background: "transparent",
                                border: "none",
                                fontSize: "24px",
                                cursor: "pointer",
                                color: "#666",
                                width: "32px",
                                height: "32px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "50%",
                                transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = "#f0f0f0";
                                e.target.style.color = "#333";
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = "transparent";
                                e.target.style.color = "#666";
                            }}
                        >
                            ×
                        </button>

                        {/* Modal Header */}
                        <div
                            style={{
                                marginBottom: "24px",
                                textAlign: "center",
                            }}
                        >
                            <h3
                                style={{
                                    margin: 0,
                                    fontSize: "24px",
                                    fontWeight: 700,
                                    color: "#333",
                                    marginBottom: "8px",
                                }}
                            >
                                Your Business Card
                            </h3>
                            <p
                                style={{
                                    margin: 0,
                                    color: "#666",
                                    fontSize: "14px",
                                    marginBottom: "20px",
                                }}
                            >
                                Preview and download your personalized business
                                card
                            </p>
                            
                            {/* Card Type Selector */}
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    gap: "12px",
                                    marginTop: "16px",
                                }}
                            >
                                <button
                                    onClick={() => setCardType("old")}
                                    style={{
                                        padding: "10px 20px",
                                        borderRadius: "8px",
                                        border: "none",
                                        background:
                                            cardType === "old"
                                                ? colorCode
                                                : "#f0f0f0",
                                        color:
                                            cardType === "old"
                                                ? "#fff"
                                                : "#666",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        transition: "all 0.3s ease",
                                        boxShadow:
                                            cardType === "old"
                                                ? "0 2px 8px rgba(0,0,0,0.2)"
                                                : "none",
                                    }}
                                >
                                    Classic Design
                                </button>
                                <button
                                    onClick={() => setCardType("new")}
                                    style={{
                                        padding: "10px 20px",
                                        borderRadius: "8px",
                                        border: "none",
                                        background:
                                            cardType === "new"
                                                ? colorCode
                                                : "#f0f0f0",
                                        color:
                                            cardType === "new"
                                                ? "#fff"
                                                : "#666",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        transition: "all 0.3s ease",
                                        boxShadow:
                                            cardType === "new"
                                                ? "0 2px 8px rgba(0,0,0,0.2)"
                                                : "none",
                                    }}
                                >
                                    Modern Design
                                </button>
                            </div>
                        </div>

                        {/* Side Toggle Buttons */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                marginBottom: "20px",
                                gap: "12px",
                            }}
                        >
                            <button
                                onClick={() => setCurrentSide("front")}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: "20px",
                                    border: "none",
                                    background:
                                        currentSide === "front"
                                            ? colorCode
                                            : "#f0f0f0",
                                    color:
                                        currentSide === "front"
                                            ? "#fff"
                                            : "#666",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    transition: "all 0.3s ease",
                                }}
                            >
                                Front Side
                            </button>
                            <button
                                onClick={toggleSide}
                                disabled={isFlipping}
                                style={{
                                    padding: "8px 12px",
                                    borderRadius: "50%",
                                    border: "none",
                                    background: isFlipping
                                        ? "#e0e0e0"
                                        : "#f0f0f0",
                                    color: "#666",
                                    fontWeight: 600,
                                    cursor: isFlipping
                                        ? "not-allowed"
                                        : "pointer",
                                    fontSize: "16px",
                                    transition: "all 0.3s ease",
                                    width: "36px",
                                    height: "36px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transform: isFlipping
                                        ? "rotate(180deg)"
                                        : "rotate(0deg)",
                                }}
                                title="Flip Card"
                            >
                                🔄
                            </button>
                            <button
                                onClick={() => setCurrentSide("back")}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: "20px",
                                    border: "none",
                                    background:
                                        currentSide === "back"
                                            ? colorCode
                                            : "#f0f0f0",
                                    color:
                                        currentSide === "back"
                                            ? "#fff"
                                            : "#666",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    transition: "all 0.3s ease",
                                }}
                            >
                                Back Side
                            </button>
                        </div>

                        {/* Business Card Preview */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                marginBottom: "24px",
                                padding: "30px",
                                background:
                                    "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                                borderRadius: "16px",
                                border: "2px dashed #e3f2fd",
                                minHeight: "480px",
                                position: "relative",
                                gap: "20px",
                            }}
                        >
                            {/* Left Arrow Button */}
                            <button
                                onClick={() =>
                                    setCurrentSide(
                                        currentSide === "front"
                                            ? "back"
                                            : "front"
                                    )
                                }
                                disabled={isFlipping}
                                style={{
                                    padding: "12px",
                                    borderRadius: "50%",
                                    border: "none",
                                    background: isFlipping
                                        ? "#e0e0e0"
                                        : "#2d4263",
                                    color: "#fff",
                                    fontWeight: 600,
                                    cursor: isFlipping
                                        ? "not-allowed"
                                        : "pointer",
                                    fontSize: "20px",
                                    transition: "all 0.3s ease",
                                    width: "48px",
                                    height: "48px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow:
                                        "0 4px 12px rgba(45, 66, 99, 0.3)",
                                }}
                                aria-label="Previous Side"
                                onMouseEnter={(e) => {
                                    if (!isFlipping) {
                                        e.target.style.transform = "scale(1.1)";
                                        e.target.style.boxShadow =
                                            "0 6px 20px rgba(45, 66, 99, 0.4)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isFlipping) {
                                        e.target.style.transform = "scale(1)";
                                        e.target.style.boxShadow =
                                            "0 4px 12px rgba(45, 66, 99, 0.3)";
                                    }
                                }}
                                title="Previous Side"
                            >
                                ◀
                            </button>

                            {/* Interactive Card Container */}
                            <div
                                ref={cardRef}
                                style={{
                                    transform: "none", // Remove any rotation to prevent text reversal
                                    transition: isFlipping
                                        ? "transform 0.6s ease-in-out"
                                        : "transform 0.3s ease",
                                    transformStyle: "preserve-3d",
                                    cursor: "pointer",
                                    userSelect: "none",
                                }}
                                onTouchStart={onTouchStart}
                                onTouchMove={onTouchMove}
                                onTouchEnd={onTouchEnd}
                                onClick={handleDoubleTap}
                                onMouseEnter={(e) => {
                                    if (!isFlipping) {
                                        e.target.style.transform =
                                            "scale(1.02)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isFlipping) {
                                        e.target.style.transform = "scale(1)";
                                    }
                                }}
                                title="Double tap or swipe to flip card"
                            >
                                <div style={{ position: "relative" }}>
                                    {/* Hidden offscreen mirrors for accurate image capture */}
                                    <div style={{ position: "absolute", left: -99999, top: -99999 }}>
                                        <div ref={frontRef}>
                                            {cardType === "new" ? (
                                                <NewBusinessCard data={{...cardData, themeColor: colorCode}} side="front" />
                                            ) : (
                                                <BusinessCard data={{...cardData, themeColor: colorCode}} side="front" />
                                            )}
                                        </div>
                                        <div ref={backRef}>
                                            {cardType === "new" ? (
                                                <NewBusinessCard data={{...cardData, themeColor: colorCode}} side="back" />
                                            ) : (
                                                <BusinessCard data={{...cardData, themeColor: colorCode}} side="back" />
                                            )}
                                        </div>
                                    </div>
                                    {cardType === "new" ? (
                                        <NewBusinessCard
                                            data={{...cardData, themeColor: colorCode}}
                                            side={currentSide}
                                        />
                                    ) : (
                                        <BusinessCard
                                            data={{...cardData, themeColor: colorCode}}
                                            side={currentSide}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Right Arrow Button */}
                            <button
                                onClick={() =>
                                    setCurrentSide(
                                        currentSide === "front"
                                            ? "back"
                                            : "front"
                                    )
                                }
                                disabled={isFlipping}
                                style={{
                                    padding: "12px",
                                    borderRadius: "50%",
                                    border: "none",
                                    background: isFlipping
                                        ? "#e0e0e0"
                                        : "#2d4263",
                                    color: "#fff",
                                    fontWeight: 600,
                                    cursor: isFlipping
                                        ? "not-allowed"
                                        : "pointer",
                                    fontSize: "20px",
                                    transition: "all 0.3s ease",
                                    width: "48px",
                                    height: "48px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow:
                                        "0 4px 12px rgba(45, 66, 99, 0.3)",
                                }}
                                aria-label="Next Side"
                                onMouseEnter={(e) => {
                                    if (!isFlipping) {
                                        e.target.style.transform = "scale(1.1)";
                                        e.target.style.boxShadow =
                                            "0 6px 20px rgba(45, 66, 99, 0.4)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isFlipping) {
                                        e.target.style.transform = "scale(1)";
                                        e.target.style.boxShadow =
                                            "0 4px 12px rgba(45, 66, 99, 0.3)";
                                    }
                                }}
                                title="Next Side"
                            >
                                ▶
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div
                            style={{
                                display: "flex",
                                gap: "12px",
                                justifyContent: "center",
                            }}
                        >
                            <button
                                aria-label="Download A4 Business Card PDF"
                                onClick={handleDownloadPDF}
                                style={{
                                    padding: "12px 24px",
                                    borderRadius: "8px",
                                    background: colorCode,
                                    color: "#fff",
                                    border: "none",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    transition: "all 0.3s ease",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                }}
                                disabled={isDownloading}
                                onMouseEnter={(e) => {
                                    e.target.style.transform =
                                        "translateY(-2px)";
                                    e.target.style.boxShadow =
                                        "0 6px 20px rgba(0,0,0,0.2)";
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = "translateY(0)";
                                    e.target.style.boxShadow = "none";
                                }}
                            >
                                <span>📄</span>
                                {isDownloading ? "Preparing..." : "Download A4 Business Card PDF"}
                            </button>
                            <button
                                onClick={handleCloseDialog}
                                style={{
                                    padding: "12px 24px",
                                    borderRadius: "8px",
                                    background: "#f5f5f5",
                                    color: "#333",
                                    border: "1px solid #e0e0e0",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    transition: "all 0.3s ease",
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = "#e0e0e0";
                                    e.target.style.transform =
                                        "translateY(-2px)";
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = "#f5f5f5";
                                    e.target.style.transform = "translateY(0)";
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ProfileBusinessCardGenerator;
