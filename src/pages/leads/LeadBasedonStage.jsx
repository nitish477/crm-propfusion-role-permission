import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import {
    Calendar,
    Phone,
    // DollarSign,
    Building,
    User,
    UserPlus,
    // MessageCircle,
    // MessageCircleMore,
    MapPin,
    // ScanSearch,
    // MoreHorizontal,
    Edit,
    // Trash2,
    // AlertCircle,
    Inbox,
    X,
    ChevronUp,
} from "lucide-react";
import styles from "./LeadBasedonStage.module.css";
import useStages from "../../features/stages/useStages";
import Spinner from "../../ui/Spinner";
import { FollowUpForm } from "../../features/leads/AddFollowUpFrom";
import { useNavigate } from "react-router-dom";
import useCreateFollowUp from "../../features/followUps/useCreateFollowUp";
import Modal from "../../ui/Modal";
import AgentChangeModal from "../../ui/AgentChangeModal";
import useStaff from "../../features/admin/staff/useStaff";
import useUpdateLead from "../../features/leads/useUpdateLead";
import { tableStyles } from "./LeadsBaseTable";
import WhatsAppSvg from "../../assets/whatsapp1.svg";
import GmailSvg from "../../assets/gmail.svg";
import ClientSourceIcon from "../../components/ClientSourceIcon";
import useAllDetails from "../../features/all-details/useAllDetails";
import toast from "react-hot-toast";
import { useMyPermissions } from "../../hooks/useHasPermission";

// Move StageColumn component outside
const StageColumn = ({
    stage,
    leads,
    moveLead,
    isUnknownStage,
    setShowFollowUp,
}) => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [{ isOver }, drop] = useDrop(() => ({
        accept: ["LEAD", "STAGE"],
        drop: (item) => {
            if (isUnknownStage) return;

            if (item.type === "STAGE") {
                item.leads.forEach((lead) => {
                    moveLead(lead, stage.id, true);
                });
            } else {
                moveLead(item.lead, stage.id);
            }
        },
        collect: (monitor) => ({
            isOver: !isUnknownStage && !!monitor.isOver(),
        }),
    }));

    const handleRowClick = (leadId) => {
        navigate(`/leads/details/${leadId.toString()}`);
    };

    return (
        <div
            ref={(node) => {
                drop(node);
            }}
            className={`${styles.stageColumn} ${isOver ? styles.dragOver : ""} ${isUnknownStage ? styles.unknownStage : ""} ${isCollapsed ? styles.collapsed : ""}`}
            style={{ borderTop: `3px solid ${stage.color_code}` }}
            data-stage-id={stage.id}
        >
            <div className={styles.stageHeader}>
                <span
                    className={styles.stageTitle}
                    style={{ color: stage.color_code }}
                >
                    {stage.name}
                </span>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                    }}
                >
                    <span
                        className={styles.leadCountRight}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            fontSize: "2.2rem",
                            fontWeight: "bold",
                            color: stage.color_code,
                        }}
                    >
                        {leads.length}
                    </span>
                    <button
                        className={styles.collapseButton}
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        title={isCollapsed ? "Expand stage" : "Collapse stage"}
                    >
                        <ChevronUp size={14} />
                    </button>
                </div>
            </div>
            {!isCollapsed && (
                <div className={styles.leadList}>
                    {leads.length > 0 ? (
                        leads.map((lead) => (
                            <DraggableLeadCard
                                key={lead.id}
                                lead={lead}
                                stageColor={stage.color_code}
                                handleRowClick={() =>
                                    handleRowClick(lead.id.toString())
                                }
                                setShowFollowUp={setShowFollowUp}
                            />
                        ))
                    ) : (
                        <div className={styles.emptyState}>
                            <Inbox size={48} />
                            <p>No leads in this stage</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Main component
const LeadBasedOnStage = ({
    data,
    isLoading,
    containerRef,
    onLoadMore,
    isFetchingNextPage,
}) => {
    const { data: stages } = useStages("leads");
    const [leadsData, setLeadsData] = useState({});
    const [showFollowUp, setShowFollowUp] = useState(null);
    const [isDraggingOverGap, setIsDraggingOverGap] = useState(false);
    const { addFollowUp } = useCreateFollowUp();
    const scrollTimeout = useRef(null);

    // Improved scroll handler with debounce
    const handleScroll = useCallback(() => {
        if (!containerRef?.current || isFetchingNextPage) return;

        if (scrollTimeout.current) {
            clearTimeout(scrollTimeout.current);
        }

        scrollTimeout.current = setTimeout(() => {
            const { scrollTop, scrollHeight, clientHeight } =
                containerRef.current;
            const scrolledToBottom =
                scrollHeight - scrollTop <= clientHeight * 1.2;

            if (scrolledToBottom) {
                // Check if we have more pages to fetch
                const currentPage = data?.page || 0;
                const totalPages = data?.totalPages || 0;

                if (currentPage < totalPages) {
                    onLoadMore?.();
                }
            }
        }, 150);
    }, [onLoadMore, containerRef, isFetchingNextPage, data]);

    useEffect(() => {
        const container = containerRef?.current;
        if (!container) return;

        container.addEventListener("scroll", handleScroll);
        return () => {
            container.removeEventListener("scroll", handleScroll);
            if (scrollTimeout.current) {
                clearTimeout(scrollTimeout.current);
            }
        };
    }, [handleScroll, containerRef]);

    const groupLeadsByStage = React.useMemo(() => {
        if (!stages || !data) return {};

        const groupedLeads = stages.reduce((acc, stage) => {
            acc[stage.id] = data.filter(
                (lead) => lead.latest_followup?.stages === stage.id.toString()
            );
            return acc;
        }, {});

        groupedLeads["unknown"] = data.filter(
            (lead) =>
                !lead.latest_followup?.stages ||
                !stages.some(
                    (stage) =>
                        stage.id.toString() === lead.latest_followup?.stages
                )
        );

        return groupedLeads;
    }, [stages, data]);

    useEffect(() => {
        if (JSON.stringify(groupLeadsByStage) !== JSON.stringify(leadsData)) {
            setLeadsData(groupLeadsByStage);
        }
    }, [groupLeadsByStage]);

    const moveLead = useCallback(
        async (lead, toStageId, isMultiple = false) => {
            if (toStageId === "unknown") return;

            try {
                // Get stage name for logging
                const stageName =
                    stages?.find((s) => s.id === toStageId)?.name ||
                    "Unknown Stage";

                // Create follow-up payload for stage change
                const payload = {
                    type: "lead",
                    target_id: lead.id,
                    comment: `Stage changed to: ${stageName}`,
                    stages: toStageId.toString(),
                    text: "Stage Change",
                };

                // Add follow-up to track stage change
                if (toStageId !== "unknown") {
                    await addFollowUp(payload);
                }

                // Update local state immediately for smooth UX
                setLeadsData((prevLeads) => {
                    const updatedLeads = { ...prevLeads };
                    const currentStageId = Object.keys(updatedLeads).find(
                        (stageId) =>
                            updatedLeads[stageId]?.some((l) => l.id === lead.id)
                    );

                    if (currentStageId) {
                        if (isMultiple) {
                            const leadsToMove = updatedLeads[currentStageId];
                            updatedLeads[currentStageId] = [];

                            const updatedLeadsArray = leadsToMove.map((l) => ({
                                ...l,
                                latest_followup: {
                                    ...l.latest_followup,
                                    stages: toStageId.toString(),
                                },
                            }));

                            updatedLeads[toStageId] = [
                                ...(updatedLeads[toStageId] || []),
                                ...updatedLeadsArray,
                            ];
                        } else {
                            updatedLeads[currentStageId] = updatedLeads[
                                currentStageId
                            ].filter((l) => l.id !== lead.id);
                            const updatedLead = {
                                ...lead,
                                latest_followup: {
                                    ...lead.latest_followup,
                                    stages: toStageId.toString(),
                                },
                            };
                            updatedLeads[toStageId] = [
                                ...(updatedLeads[toStageId] || []),
                                updatedLead,
                            ];
                        }
                    }

                    return updatedLeads;
                });

                // Show success message
                toast.success(`Lead moved to ${stageName} successfully!`);

                // Refresh data from server to ensure consistency
                // Instead of page refresh, we can trigger a data refetch
                // This will be handled by the parent component's data fetching logic
            } catch (error) {
                console.error("Error moving lead:", error);
                toast.error("Failed to move lead. Please try again.");

                // Revert local state on error
                // You might want to refresh the data from server here
            }
        },
        [addFollowUp, stages, toast]
    );

    const [, drop] = useDrop(() => ({
        accept: ["LEAD", "STAGE"],
        hover: (item, monitor) => {
            if (!monitor.isOver()) return;
            setIsDraggingOverGap(true);
        },
        drop: (item, monitor) => {
            const dropPos = monitor.getClientOffset();
            if (!dropPos) return;

            const stageColumns = document.querySelectorAll(
                `.${styles.stageColumn}`
            );
            let nearestStage = null;
            let minDistance = Infinity;

            stageColumns.forEach((column) => {
                const stageId = column.getAttribute("data-stage-id");
                if (stageId === "unknown") return;

                const rect = column.getBoundingClientRect();
                const columnCenter = rect.left + rect.width / 2;
                const distance = Math.abs(columnCenter - dropPos.x);

                if (distance < minDistance) {
                    minDistance = distance;
                    nearestStage = stageId;
                }
            });

            if (nearestStage) {
                moveLead(item.lead, nearestStage, item.isMultiple);
            }

            setIsDraggingOverGap(false);
        },
    }));

    if (isLoading) return <Spinner type="fullPage" />;

    return (
        <>
            <div>
                <div
                    className={styles.boardContainer}
                    style={{
                        flex: 1,
                        minHeight: 0,
                        overflowX: "auto",
                        overflowY: "auto",
                        display: "flex",
                        WebkitOverflowScrolling: "touch",
                    }}
                >
                    <StageColumn
                        key="unknown"
                        stage={{
                            id: "unknown",
                            name: "New Leads",
                            color_code: "#808080",
                        }}
                        leads={leadsData["unknown"] || []}
                        moveLead={moveLead}
                        isUnknownStage={true}
                        setShowFollowUp={setShowFollowUp}
                    />

                    {stages
                        ?.sort((a, b) => a.position - b.position)
                        .map((stage) => (
                            <StageColumn
                                key={stage.id}
                                stage={stage}
                                leads={leadsData[stage.id] || []}
                                moveLead={moveLead}
                                isUnknownStage={false}
                                setShowFollowUp={setShowFollowUp}
                            />
                        ))}
                    {isDraggingOverGap && (
                        <div className={styles.dropIndicator} />
                    )}
                </div>

                {isFetchingNextPage && (
                    <div className={styles.bottomLoader}>
                        <Spinner />
                    </div>
                )}

                {/* Global styles for tooltips */}
                <style>{`
                .whatsapp-tooltip-container {
                    position: relative;
                }
                .whatsapp-tooltip-container:hover .whatsapp-tooltip {
                    display: block !important;
                    z-index: 9999 !important;
                    pointer-events: auto !important;
                }
                .whatsapp-tooltip {
                    pointer-events: none;
                }
                .leadCard {
                    position: relative;
                    z-index: 1;
                }
                .leadCard:hover {
                    z-index: 1000;
                }
                .whatsapp-tooltip-container:hover {
                    z-index: 1001;
                }
            `}</style>

                {showFollowUp && (
                    <div className={styles.followUpOverlay}>
                        <div className={styles.followUpModal}>
                            <button
                                className={styles.closeButton}
                                onClick={() => setShowFollowUp(null)}
                            >
                                <X size={25} />
                            </button>
                            <FollowUpForm
                                type="lead"
                                targetId={showFollowUp.leadId}
                                comment={showFollowUp.comment}
                                stage={showFollowUp.stageid}
                                onCloseModal={() => setShowFollowUp(null)}
                            />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

// Helper function to extract info from message
const extractInfoFromMessage = (message) => {
    if (!message) return { link: "", refNumber: "" };

    const linkMatch = message.match(/https?:\/\/[^\s]+/);
    const refMatch = message.match(/ref:?\s*([^\s]+)/i);

    return {
        link: linkMatch ? linkMatch[0] : "",
        refNumber: refMatch ? refMatch[1] : "",
    };
};

// DraggableLeadCard component
const DraggableLeadCard = ({
    lead,
    stageColor,
    handleRowClick,
    setShowFollowUp,
}) => {
    const { data: staffData, isLoading: isLoadingStaff } = useStaff();
    const { data: allDetails } = useAllDetails();
    const { changeLead, isPending: isUpdatingLead } = useUpdateLead();
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipContent, setTooltipContent] = useState("");
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const tooltipTimeout = useRef(null);
    const { hasPermission } = useMyPermissions();
    const currentUserId = allDetails?.current_user_details?.id;

    const handleClaim = (leadId) => {
        if (!currentUserId) {
            toast.error("User details not found");
            return;
        }
        changeLead(
            {
                id: leadId,
                payload: { agent_Id: currentUserId },
            },
            {
                onSuccess: () => toast.success("Lead claimed successfully"),
            }
        );
    };

    const [{ isDragging }, drag] = useDrag(() => ({
        type: "LEAD",
        item: {
            type: "LEAD",
            lead,
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));

    // const formatBudget = (value) => {
    //     return new Intl.NumberFormat("en-US", {
    //         style: "currency",
    //         currency: "AED",
    //         maximumFractionDigits: 0,
    //     }).format(value);
    // };

    const handleChangeAgent = useCallback(
        (agentId, leadId, onCloseModal) => {
            changeLead(
                {
                    id: leadId,
                    payload: { agent_Id: agentId },
                },
                {
                    onSettled: () => {
                        onCloseModal();
                    },
                }
            );
        },
        [changeLead]
    );

    const handleFollowUpClick = (e) => {
        e.stopPropagation();
        setShowFollowUp({
            leadId: lead.id,
            comment: lead.comment,
            stageid: lead.latest_followup?.stages,
        });
    };

    const handleMouseEnter = (content, event) => {
        if (tooltipTimeout.current) {
            clearTimeout(tooltipTimeout.current);
        }

        tooltipTimeout.current = setTimeout(() => {
            const rect = event.currentTarget.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;

            // Calculate position to ensure tooltip is visible within viewport
            const x = Math.min(
                Math.max(rect.left + rect.width / 2, 150),
                viewportWidth - 150
            );
            const y = Math.min(
                Math.max(rect.top - 10, 100),
                viewportHeight - 100
            );

            setTooltipPosition({
                x: x,
                y: y,
            });
            setTooltipContent(content);
            setShowTooltip(true);
        }, 300); // Reduced timeout for better responsiveness
    };

    const handleMouseLeave = () => {
        if (tooltipTimeout.current) {
            clearTimeout(tooltipTimeout.current);
        }
        setShowTooltip(false);
    };

    // Custom handler for WhatsApp notification tooltips
    const handleWhatsAppTooltip = (event) => {
        event.stopPropagation();
        // Don't use the regular tooltip system for this
        // WhatsApp tooltips are controlled by CSS hover
    };
    let whatsappMessage;
    const handleWhatsAppClick = (
        message,
        agentName,
        phoneNumber,
        clientType
    ) => {
        const { link, refNumber } = extractInfoFromMessage(message);
        const propertyLink = link;
        const whatsappNumber = phoneNumber;
        const companyName = allDetails?.company_settings?.company_name || "";

        if (clientType?.toLowerCase() === "rent") {
            whatsappMessage = `This is ${agentName} from ${companyName} . 👋

Thanks for your interest in this property — here’s the listing link for your reference: ${propertyLink}

If you could share your move-in date, budget, and preferred area or community, I can send you a few options that fit your requirements right away.

Looking forward to helping you find your next home! `;
        } else {
            whatsappMessage = `This is ${agentName} from ${companyName} . 👋

Thank you for your interest in the property you viewed — here’s the listing link for your reference: ${propertyLink} 

Are you currently looking to buy for investment or personal use?

Once I know your budget and preferred areas , I can share a few great options that match your goals.

Looking forward to helping you find the right property in Dubai. 🏡`;
        }

        //= `Hi I'm ${agentName} from ${companyName}\nYou enquired on my hot listing\n${propertyLink}`;

        if (refNumber) {
            whatsappMessage += `\nReference no.: ${refNumber}`;
        }

        let whatsappUrl = "https://wa.me/";
        if (whatsappNumber) {
            const cleanNumber = whatsappNumber.replace(/^\+/, "");
            whatsappUrl += cleanNumber;
        }
        whatsappUrl += `?text=${encodeURIComponent(whatsappMessage)}`;

        window.open(whatsappUrl, "_blank");
    };

    useEffect(() => {
        return () => {
            if (tooltipTimeout.current) {
                clearTimeout(tooltipTimeout.current);
            }
        };
    }, []);

    // const isToday = (dateString) => {
    //     if (!dateString) return false;
    //     const date = new Date(dateString);
    //     const now = new Date();
    //     return (
    //         date.getDate() === now.getDate() &&
    //         date.getMonth() === now.getMonth() &&
    //         date.getFullYear() === now.getFullYear()
    //     );
    // };

    const capitalizeFirstLetter = (string) => {
        if (!string) return "";
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    return (
        <div
            ref={drag}
            className={`${styles.leadCard} ${isDragging ? styles.dragging : ""}`}
            style={{ "--stage-color": stageColor }}
        >
            <div
                className={styles.cardHeader}
                style={{
                    display: "flex",
                    alignItems: "center",
                    alignContent: "center",
                    justifyContent: "space-between",
                }}
            >
                <div className={styles.avatarSection}>
                    <div
                        onClick={() => handleRowClick(lead?.id)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                        }}
                    >
                        <div>{lead?.name}</div>
                        {lead?.clientSource === "Facebook" && (
                            <img
                                src={"/images/facebook.avif"}
                                alt="Facebook"
                                width={18}
                                height={18}
                                style={{
                                    display: "inline-block",
                                    verticalAlign: "middle",
                                }}
                            />
                        )}
                    </div>
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    {lead?.createTime &&
                        (() => {
                            const now = new Date();
                            const updated = new Date(lead.createTime);
                            const diffTime =
                                now.setHours(0, 0, 0, 0) -
                                updated.setHours(0, 0, 0, 0);
                            const diffDays = Math.floor(
                                diffTime / (1000 * 60 * 60 * 24)
                            );
                            let label = "";
                            if (diffDays === 0) label = "Today";
                            else if (diffDays > 0 && diffDays <= 99)
                                label = `${diffDays}d`;
                            else if (diffDays > 99) label = "99+d";
                            return label ? (
                                <span
                                    style={{
                                        background: "#e0ffe0",
                                        color: "#2e7d32",
                                        borderRadius: "6px",
                                        padding: "2px 8px",
                                        fontSize: "11px",
                                        fontWeight: "bold",
                                        border: "1px solid #2e7d32",
                                    }}
                                >
                                    {label}
                                </span>
                            ) : null;
                        })()}
                    <button
                        className={styles.actionButton}
                        onClick={handleFollowUpClick}
                        onMouseEnter={(e) =>
                            handleMouseEnter("Add follow-up", e)
                        }
                        onMouseLeave={handleMouseLeave}
                    >
                        <UserPlus size={16} />
                    </button>
                    <button
                        className={styles.actionButton}
                        onClick={() => handleRowClick(lead?.id)}
                        onMouseEnter={(e) =>
                            handleMouseEnter("View details", e)
                        }
                        onMouseLeave={handleMouseLeave}
                    >
                        <Edit size={16} />
                    </button>
                </div>
            </div>
            <div className={styles.cardBody}>
                <div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                        }}
                    >
                        <div style={{ display: "flex", gap: "10px" }}>
                            <Phone
                                size={16}
                                style={{ cursor: "pointer" }}
                                onClick={() =>
                                    window.open(`tel:${lead?.phone}`, "_blank")
                                }
                                onMouseEnter={(e) =>
                                    handleMouseEnter("Call", e)
                                }
                                onMouseLeave={handleMouseLeave}
                            />
                            <img
                                src={WhatsAppSvg}
                                alt="WhatsApp"
                                width={16}
                                height={16}
                                style={{ cursor: "pointer" }}
                                onClick={() =>
                                    handleWhatsAppClick(
                                        lead?.leads_message,
                                        lead?.agent?.name,
                                        lead?.phone,
                                        lead?.clientType
                                    )
                                }
                                onMouseEnter={(e) =>
                                    handleMouseEnter("WhatsApp", e)
                                }
                                onMouseLeave={handleMouseLeave}
                            />

                            {lead?.email && (
                                <img
                                    src={GmailSvg}
                                    alt="Gmail"
                                    width={16}
                                    height={16}
                                    style={{ cursor: "pointer" }}
                                    onClick={() =>
                                        window.open(
                                            `mailto:${lead?.email}`,
                                            "_blank"
                                        )
                                    }
                                    onMouseEnter={(e) =>
                                        handleMouseEnter("Send email", e)
                                    }
                                    onMouseLeave={handleMouseLeave}
                                />
                            )}
                        </div>

                        <div>
                            <div
                                style={{
                                    display: "flex",
                                    gap: "10px",
                                    alignItems: "center",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <div
                                        style={{
                                            position: "relative",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <span
                                            style={{
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <ClientSourceIcon
                                                source={lead?.clientSource}
                                                leadMessage={
                                                    lead?.leads_message
                                                }
                                                agentName={lead?.agent?.name}
                                                phoneNumber={lead?.phone}
                                                companyLogo={
                                                    allDetails?.company_settings
                                                        ?.company_logo_url
                                                }
                                            />
                                        </span>
                                    </div>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                        }}
                                    >
                                        {lead?.clientSubSource?.toLowerCase() ===
                                            "whatsapp" && (
                                                <div
                                                    onClick={() =>
                                                        handleWhatsAppClick(
                                                            lead?.leads_message,
                                                            lead?.agent?.name,
                                                            lead?.phone
                                                        )
                                                    }
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        cursor: "pointer",
                                                        position: "relative",
                                                        zIndex: 1001,
                                                    }}
                                                    className="whatsapp-tooltip-container"
                                                    onMouseEnter={
                                                        handleWhatsAppTooltip
                                                    }
                                                >
                                                    <img
                                                        src="/icons/whatsapp/whatsapp.svg"
                                                        alt="whatsapp"
                                                        style={{
                                                            width: "20px",
                                                            height: "20px",
                                                            backgroundColor:
                                                                "#25D366",
                                                            borderRadius: "4px",
                                                            padding: "2px",
                                                        }}
                                                    />
                                                    {lead
                                                        ?.whatsapp_delivery_notifications
                                                        ?.length > 0 && (
                                                            <div
                                                                className="whatsapp-tooltip"
                                                                style={{
                                                                    display: "none",
                                                                    position:
                                                                        "absolute",
                                                                    left: "-180px",
                                                                    top: "-80px",
                                                                    backgroundColor:
                                                                        "#ffffff",
                                                                    color: "#4b5563",
                                                                    padding: "8px 10px",
                                                                    borderRadius: "4px",
                                                                    fontSize: "12px",
                                                                    whiteSpace:
                                                                        "nowrap",
                                                                    zIndex: 9999,
                                                                    boxShadow:
                                                                        "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
                                                                    border: "1px solid #e5e7eb",
                                                                    width: "180px",
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        display: "flex",
                                                                        flexDirection:
                                                                            "column",
                                                                        gap: "2px",
                                                                    }}
                                                                >
                                                                    {lead.whatsapp_delivery_notifications.map(
                                                                        (
                                                                            notification,
                                                                            index
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    index
                                                                                }
                                                                                style={{
                                                                                    marginBottom:
                                                                                        "4px",
                                                                                }}
                                                                            >
                                                                                <div
                                                                                    style={{
                                                                                        fontWeight:
                                                                                            "500",
                                                                                        fontSize:
                                                                                            "12px",
                                                                                        color: "#4a5568",
                                                                                        lineHeight:
                                                                                            "1.3",
                                                                                    }}
                                                                                >
                                                                                    Status:{" "}
                                                                                    {
                                                                                        notification.status
                                                                                    }
                                                                                </div>
                                                                                <div
                                                                                    style={{
                                                                                        fontSize:
                                                                                            "11px",
                                                                                        color: "#718096",
                                                                                        lineHeight:
                                                                                            "1.3",
                                                                                    }}
                                                                                >
                                                                                    Time:{" "}
                                                                                    {new Date(
                                                                                        notification.created_at
                                                                                    )
                                                                                        .toLocaleString(
                                                                                            undefined,
                                                                                            {
                                                                                                month: "numeric",
                                                                                                day: "numeric",
                                                                                                year: "numeric",
                                                                                                hour: "2-digit",
                                                                                                minute: "2-digit",
                                                                                                hour12: true,
                                                                                            }
                                                                                        )
                                                                                        .replace(
                                                                                            ",",
                                                                                            ""
                                                                                        )}
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                </div>
                                            )}
                                        {lead?.clientSubSource?.toLowerCase() ===
                                            "email" && (
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <img
                                                        src="/icons/email.svg"
                                                        alt="email"
                                                        style={{
                                                            width: "20px",
                                                            height: "20px",
                                                            filter: "brightness(0)",
                                                            borderRadius: "4px",
                                                            padding: "2px",
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        <style>{`
                                            .whatsapp-tooltip-container:hover .whatsapp-tooltip {
                                                display: block !important;
                                            }
                                        `}</style>
                                        {lead?.clientSubSource !== "WhatsApp" &&
                                            lead?.clientSubSource?.toLowerCase() !==
                                            "email" &&
                                            capitalizeFirstLetter(
                                                lead?.clientSubSource
                                            )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: "10px",
                            marginTop: "8px",
                        }}
                    >
                        <MapPin size={16} />
                        <span style={{ fontSize: "14px" }}>
                            {lead?.location ? (
                                <div
                                    style={{
                                        color: "#6b7280",
                                        fontSize: "12px",
                                        opacity: 0.8,
                                    }}
                                >
                                    {lead.location.sub_community}
                                    <span>, </span>
                                    {lead.location.community}
                                    {/* <span>, </span> */}
                                    {/* {item.location.city} */}
                                </div>
                            ) : (
                                "No location"
                            )}
                        </span>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: "10px",
                            marginTop: "8px",
                        }}
                    >
                        <Building size={16} />
                        <span style={{ fontSize: "14px" }}>
                            {lead?.property_type
                                ? lead?.property_type[0]
                                : "No property type"}
                        </span>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "10px",
                            marginTop: "3px",
                        }}
                    >
                        <div>
                            <Calendar size={16} />
                            <span
                                style={{ fontSize: "14px", marginLeft: "8px" }}
                            >
                                {lead?.createTime
                                    ? new Date(lead.createTime)
                                        .toLocaleString("en-US", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                        })
                                        .replace(",", "")
                                    : "No create time"}
                            </span>
                        </div>

                        <div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                {lead.latest_followup?.date && (
                                    <div>
                                        <Calendar size={14} />
                                        <span
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: "bold",
                                                marginLeft: "5px",
                                                border: "1px solid red",
                                            }}
                                        >
                                            Last Contact:{" "}
                                            {new Date(
                                                lead.latest_followup.date
                                            )
                                                .toLocaleString("en-US", {
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    hour12: true,
                                                })
                                                .replace(",", "")}
                                        </span>
                                    </div>
                                )}

                                <div style={{ marginLeft: "auto" }}>
                                    {hasPermission("assign_leads") ? (
                                        <Modal>
                                            <Modal.Open openWindowName="chooseAgent">
                                                <button
                                                    disabled={isUpdatingLead}
                                                    style={{
                                                        ...tableStyles.agentButton,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "8px",
                                                        padding: "4px 8px",
                                                        fontSize: "14px",
                                                    }}
                                                    onMouseEnter={(e) =>
                                                        handleMouseEnter(
                                                            "Change agent",
                                                            e
                                                        )
                                                    }
                                                    onMouseLeave={
                                                        handleMouseLeave
                                                    }
                                                >
                                                    {lead?.agent?.avatar ? (
                                                        <img
                                                            src={
                                                                lead?.agent
                                                                    ?.avatar
                                                            }
                                                            style={{
                                                                width: "24px",
                                                                height: "24px",
                                                                borderRadius:
                                                                    "50%",
                                                                objectFit:
                                                                    "cover",
                                                            }}
                                                            alt={
                                                                lead?.agent
                                                                    ?.title
                                                            }
                                                        />
                                                    ) : (
                                                        <User
                                                            size={24}
                                                            style={{
                                                                color: "#718096",
                                                                borderRadius:
                                                                    "50%",
                                                                border: "1px solid #E2E8F0",
                                                                backgroundColor:
                                                                    "#F3F4F6",
                                                                padding: "2px",
                                                            }}
                                                        />
                                                    )}
                                                    <span>
                                                        {lead?.agent
                                                            ? ""
                                                            : "No Agent"}
                                                    </span>
                                                    <img
                                                        src="/icons/chevron-down.svg"
                                                        style={{
                                                            width: "14px",
                                                            height: "14px",
                                                            opacity: 0.5,
                                                        }}
                                                        alt="Change agent"
                                                    />
                                                </button>
                                            </Modal.Open>
                                            <Modal.Window name="chooseAgent">
                                                <AgentChangeModal
                                                    staffData={staffData}
                                                    onChangeAgent={(
                                                        agentId,
                                                        onCloseModal
                                                    ) =>
                                                        handleChangeAgent(
                                                            agentId,
                                                            lead.id,
                                                            onCloseModal
                                                        )
                                                    }
                                                    isChangingAgent={
                                                        isUpdatingLead
                                                    }
                                                />
                                            </Modal.Window>
                                        </Modal>
                                    ) : lead.status === "POOL" ? (
                                        <button
                                            disabled={isUpdatingLead}
                                            onClick={() =>
                                                handleClaim(lead.id)
                                            }
                                            style={{
                                                ...tableStyles.agentButton,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                                padding: "4px 8px",
                                                fontSize: "14px",
                                                background: "#22c55e",
                                                color: "white",
                                                border: "none",
                                            }}
                                        >
                                            Claim
                                        </button>
                                    ) : (
                                        <div
                                            style={{
                                                ...tableStyles.agentButton,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                                padding: "4px 8px",
                                                fontSize: "14px",
                                            }}
                                        >
                                            {lead?.agent?.avatar ? (
                                                <img
                                                    src={lead?.agent?.avatar}
                                                    style={{
                                                        width: "24px",
                                                        height: "24px",
                                                        borderRadius: "50%",
                                                        objectFit: "cover",
                                                    }}
                                                    alt={lead?.agent?.title}
                                                />
                                            ) : (
                                                <User
                                                    size={24}
                                                    style={{
                                                        color: "#718096",
                                                        borderRadius: "50%",
                                                        border: "1px solid #E2E8F0",
                                                        backgroundColor:
                                                            "#F3F4F6",
                                                        padding: "2px",
                                                    }}
                                                />
                                            )}
                                            <span>
                                                {lead?.agent
                                                    ? lead?.agent?.name
                                                    : "No Agent"}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showTooltip && (
                <div
                    className={styles.tooltip}
                    style={{
                        position: "fixed",
                        left: `${tooltipPosition.x}px`,
                        top: `${tooltipPosition.y}px`,
                        transform: "translate(-50%, -100%)",
                    }}
                >
                    {tooltipContent}
                </div>
            )}
            <style>{`
                .whatsapp-tooltip-container:hover .whatsapp-tooltip {
                    display: block !important;
                }
            `}</style>
        </div>
    );
};

export default LeadBasedOnStage;
