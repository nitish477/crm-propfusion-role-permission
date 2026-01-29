import { useNavigate, useSearchParams } from "react-router-dom";
import LeadItemTag from "../../features/leads/LeadItemTag";
import Spinner from "../../ui/Spinner";
import toast from "react-hot-toast";
import { useEffect, useCallback, useRef, useState } from "react";
import LeadsItemStage from "../../features/leads/LeadsItemStage";
import LeadsItemGroups from "../../features/leads/LeadsItemGroups";
import AddLeadFollowup from "./AddLeadFollowup";
import useStaff from "../../features/admin/staff/useStaff";
import Modal from "../../ui/Modal";
import AgentChangeModal from "../../ui/AgentChangeModal";
import useUpdateLead from "../../features/leads/useUpdateLead";
import { capitalizeFirstLetter } from "../../utils/utils";
import ClientSourceIcon from "../../components/ClientSourceIcon";
import { Checkbox, Menu, MenuItem } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PendingIcon from "@mui/icons-material/Pending";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { updateBulkLeadDraft, sendLeadReminder } from "../../services/apiLeads";
import useAllDetails from "../../features/all-details/useAllDetails";
import LeadDetailsModal from "../../features/leads/LeadDetailsModal";
import styles from "./LeadsBaseTable.module.css";
import LeadTableCell from "./lastFollowUpDetails";
import { useMyPermissions } from "../../hooks/useHasPermission";

// eslint-disable-next-line react-refresh/only-export-components
export const tableStyles = {
    container: {
        width: "100%",
        overflowX: "auto",
        overflowY: "visible",
        backgroundColor: "#ffffff",
        padding: "1.5rem",
        paddingBottom: "0px",
        borderRadius: "16px",
        border: "1px solid #e2e8f0",
        borderBottom: "none",
        boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    table: {
        width: "100%",
        minWidth: "120rem",
        borderCollapse: "separate",
        borderSpacing: 0,
    },
    thead: {
        backgroundColor: "#f8fafc",
        position: "sticky",
        top: 0,
        borderRadius: "12px 12px 0 0",
    },
    th: {
        padding: "8px 12px",
        textAlign: "left",
        fontWeight: "700",
        color: "#1e293b",
        borderBottom: "2px solid #e2e8f0",
        whiteSpace: "nowrap",
        fontSize: "11px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        cursor: "pointer",
        userSelect: "none",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
    },
    tr: {
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
            backgroundColor: "#f8fafc",
            transform: "translateY(-1px)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        },
    },
    td: {
        padding: "8px 12px",
        borderBottom: "1px solid #f1f5f9",
        color: "#334155",
        fontSize: "13px",
        lineHeight: "1.4",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    agentButton: {
        display: "flex",
        alignItems: "center",
        padding: "4px 6px",
        borderRadius: "6px",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
        fontSize: "10px",
        width: "100%",
        justifyContent: "center",
        "&:hover": {
            backgroundColor:
                "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)",
            borderColor: "#94a3b8",
            transform: "translateY(-1px)",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        },
    },
    detailsButton: {
        padding: "10px 20px",
        backgroundColor: "transparent",
        color: "#475569",
        border: "2px solid #e2e8f0",
        borderRadius: "10px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "600",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
        "&:hover": {
            backgroundColor: "#f8fafc",
            borderColor: "#3b82f6",
            color: "#3b82f6",
            transform: "translateY(-1px)",
            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)",
        },
    },
    messageContainer: {
        position: "relative",
        display: "inline-block",
        cursor: "pointer",
        backgroundColor: "transparent",
    },
    messageIcon: {
        marginLeft: 6,
        verticalAlign: "middle",
        opacity: 0.8,
        width: "16px",
        height: "16px",
    },
    messageTooltip: {
        visibility: "hidden",
        position: "absolute",
        left: "100%",
        top: "50%",
        transform: "translateY(-50%)",
        backgroundColor: "#1e293b",
        color: "white",
        padding: "8px 12px",
        borderRadius: "6px",
        fontSize: "14px",
        whiteSpace: "nowrap",
        marginLeft: "10px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        "&::before": {
            content: '""',
            position: "absolute",
            right: "100%",
            top: "50%",
            marginTop: "-5px",
            border: "5px solid transparent",
            borderRightColor: "#1e293b",
        },
    },
    messageIconHover: {
        "&:hover + div": {
            visibility: "visible",
        },
    },
};

// Add this debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add this function after the debounce function

function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} sec ago`;

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24)
        return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30)
        return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12)
        return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;

    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} year${diffInYears > 1 ? "s" : ""} ago`;
}

export default function LeadsBaseTable({
    data,
    error,
    isLoading,
    containerRef,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
}) {
    const navigate = useNavigate();
    const [selectedLeads, setSelectedLeads] = useState([]);
    const [isUpdatingBulk, setIsUpdatingBulk] = useState(false);
    const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
    const { data: companyData } = useAllDetails();
    const companyName = companyData?.company_settings?.company_name;
    const [isBulkSending, setIsBulkSending] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const status = searchParams.get("status") || "ACTIVE"; // "DEAL"
    const { hasPermission } = useMyPermissions();
    const currentUserId = companyData?.current_user_details?.id;

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

    const extractInfoFromMessage = (text) => {
        if (!text) return { link: "", refNumber: "", phone: "" };

        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urlMatches = text.match(urlRegex);
        const link = urlMatches ? urlMatches[0] : "";

        const refRegex = /Reference no\.: ([^\s]+)/i;
        const refMatch = text.match(refRegex);
        const refNumber = refMatch ? refMatch[1] : "";

        const phoneRegex =
            /(?:(?:\+|00)([1-9]\d{0,3}))?[-. (]*(\d{1,4})[-. )]*(\d{1,4})[-. ]*(\d{1,9})/g;
        const phoneMatches = text.match(phoneRegex);
        const phone = phoneMatches
            ? phoneMatches[0].replace(/[^0-9+]/g, "")
            : "";

        return { link, refNumber, phone };
    };
    const handleWhatsAppClick = (
        leadMessage,
        agentName,
        phoneNumber,
        clintType,
        preferred_property
    ) => {
        const { link, refNumber } = extractInfoFromMessage(leadMessage);
        const propertyLink = `${window.location.origin}/share-new-property/${clintType?.toLowerCase()}/${preferred_property}`;
        const whatsappNumber = phoneNumber;
        let whatsappMessage;

        if (clintType?.toLowerCase() === "rent") {
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
    // eslint-disable-next-line no-unused-vars
    const { data: staffData } = useStaff();
    const { changeLead, isPending: isUpdatingLead } = useUpdateLead();

    const debouncedFetch = useRef(debounce(() => fetchNextPage(), 300)).current;

    const handleScroll = useCallback(() => {
        try {
            if (!containerRef?.current) return;

            const { scrollTop, scrollHeight, clientHeight } =
                containerRef.current;
            const scrollPercentage =
                (scrollTop / (scrollHeight - clientHeight)) * 100;

            if (scrollPercentage > 70 && hasNextPage && !isFetchingNextPage) {
                // Check if we have more pages to fetch
                const currentPage = data?.page || 0;
                const totalPages = data?.totalPages || 0;

                if (currentPage < totalPages) {
                    debouncedFetch();
                }
            }
        } catch (error) {
            console.error("Error in scroll handler:", error);
        }
    }, [containerRef, hasNextPage, isFetchingNextPage, debouncedFetch, data]);

    useEffect(() => {
        const currentRef = containerRef?.current;
        if (!currentRef) return;

        currentRef.addEventListener("scroll", handleScroll);
        return () => currentRef.removeEventListener("scroll", handleScroll);
    }, [containerRef, handleScroll]);

    useEffect(() => {
        if (error) toast.error(error.message);
    }, [error]);

    if (isLoading) return <Spinner type="fullPage" />;

    function handleChangeAgent(agentId, leadId, onCloseModal) {
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
    }

    const handleSort = () => {
        const currentSort = searchParams.get("dateSortType") || "DESC";
        const newSort = currentSort === "DESC" ? "ASC" : "DESC";
        searchParams.set("dateSortType", newSort);
        setSearchParams(searchParams);
    };

    const currentSort = searchParams.get("dateSortType") || "DESC";
    const sortIcon = currentSort === "DESC" ? "↓" : "↑";

    const handlePreferredPropertyClick = (propertyId, clientType) => {
        if (clientType === "SELL") {
            window.open(`/for-sell/new-list/${propertyId}`, "_blank");
        } else if (clientType === "RENT") {
            window.open(`/for-rent/new-list/${propertyId}`, "_blank");
        }
    };

    const handleCheckboxChange = (leadId) => {
        setSelectedLeads((prev) => {
            if (prev.includes(leadId)) {
                return prev.filter((id) => id !== leadId);
            } else {
                return [...prev, leadId];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectedLeads.length === data?.length) {
            setSelectedLeads([]);
        } else {
            setSelectedLeads(data?.map((item) => item.id) || []);
        }
    };

    const handleBulkStatusUpdate = async (status) => {
        if (selectedLeads.length === 0) {
            toast.error("Please select at least one lead");
            return;
        }

        try {
            setIsUpdatingBulk(true);
            await updateBulkLeadDraft(selectedLeads, { status });
            toast.success(
                `Successfully updated ${selectedLeads.length} leads to ${status}`
            );
            setSelectedLeads([]);
            // Refresh the data
            refetch();
        } catch (error) {
            toast.error(error.message || "Failed to update leads");
        } finally {
            setIsUpdatingBulk(false);
            handleCloseStatusMenu();
        }
    };
    const handleBulkMakePublic = async (isPublic) => {
        if (selectedLeads.length === 0) {
            toast.error("Please select at least one lead");
            return;
        }

        try {
            setIsUpdatingBulk(true);
            await updateBulkLeadDraft(selectedLeads, { is_public: isPublic });
            toast.success(
                `Successfully updated ${selectedLeads.length} leads to ${status}`
            );
            setSelectedLeads([]);
            // Refresh the data
            refetch();
        } catch (error) {
            toast.error(error.message || "Failed to update leads");
        } finally {
            setIsUpdatingBulk(false);
            handleCloseStatusMenu();
        }
    };

    const handleOpenStatusMenu = (event) => {
        setStatusMenuAnchor(event.currentTarget);
    };

    const handleCloseStatusMenu = () => {
        setStatusMenuAnchor(null);
    };

    const handleOpenAssignAgentModal = () => {
        handleCloseStatusMenu();
        // Trigger the hidden modal opener
        document.getElementById("bulkAssignAgentModalTrigger")?.click();
    };

    const handleBulkAgentAssign = async (agentId) => {
        if (selectedLeads.length === 0) {
            toast.error("Please select at least one lead");
            return;
        }

        try {
            setIsUpdatingBulk(true);
            await updateBulkLeadDraft(selectedLeads, { agent_Id: agentId });
            toast.success(
                `Successfully assigned agent to ${selectedLeads.length} leads`
            );
            setSelectedLeads([]);
            refetch();
        } catch (error) {
            toast.error(error.message || "Failed to update leads");
        } finally {
            setIsUpdatingBulk(false);
            refetch();
        }
    };

    const handleBulkSendReminder = async () => {
        if (selectedLeads.length === 0) {
            toast.error("Please select at least one lead");
            return;
        }

        setIsBulkSending(true);

        try {
            for (let i = 0; i < selectedLeads.length; i++) {
                const leadId = selectedLeads[i];
                try {
                    const res = await sendLeadReminder(leadId);
                    if (res.whatsapp_status === "success") {
                        toast.success(`Reminder sent to lead ${leadId}`);
                        refetch();
                    } else {
                        toast.error(
                            res.message || `Failed to send to lead ${leadId}`
                        );
                    }
                } catch (error) {
                    toast.error(
                        error.message || `Failed to send to lead ${leadId}`
                    );
                }

                // Wait 1 second before next reminder (except for the last one)
                if (i < selectedLeads.length - 1) {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }
            }

            toast.success(
                `Bulk reminder process completed for ${selectedLeads.length} leads`
            );
        } catch (error) {
            toast.error("An error occurred during bulk reminder process");
        } finally {
            setIsBulkSending(false);
            refetch();
        }
    };

    return (
        <>
            {selectedLeads.length > 0 && (
                <div className={styles.bulkActionContainer}>
                    <div>
                        <span className={styles.selectedCount}>
                            {selectedLeads.length}{" "}
                            {selectedLeads.length === 1 ? "lead" : "leads"}{" "}
                            selected
                        </span>
                    </div>
                    <div className={styles.buttonGroup}>
                        {status !== "ACTIVE" && (
                            <button
                                className={styles.primaryButton}
                                disabled={isUpdatingBulk || isBulkSending}
                                onClick={() => handleBulkStatusUpdate("ACTIVE")}
                            >
                                Set Active
                            </button>
                        )}
                        {status !== "INACTIVE" && (
                            <button
                                className={styles.errorButton}
                                disabled={isUpdatingBulk || isBulkSending}
                                onClick={() =>
                                    handleBulkStatusUpdate("INACTIVE")
                                }
                            >
                                Set Inactive
                            </button>
                        )}
                        <button
                            className={styles.secondaryButton}
                            disabled={isBulkSending || isUpdatingBulk}
                            onClick={handleBulkSendReminder}
                        >
                            {isBulkSending
                                ? "Sending..."
                                : "Send Bulk Reminder"}
                        </button>
                        <div>
                            <button
                                className={styles.moreOptionsButton}
                                onClick={handleOpenStatusMenu}
                                disabled={isUpdatingBulk || isBulkSending}
                            >
                                More Options
                                <KeyboardArrowDownIcon
                                    style={{ fontSize: "1.2rem" }}
                                />
                            </button>
                            <Menu
                                anchorEl={statusMenuAnchor}
                                open={Boolean(statusMenuAnchor)}
                                onClose={handleCloseStatusMenu}
                                classes={{ paper: styles.menu }}
                            >
                                <MenuItem
                                    onClick={handleOpenAssignAgentModal}
                                    className={styles.menuItem}
                                >
                                    Assign Agent
                                </MenuItem>
                                <MenuItem
                                    onClick={() => handleBulkMakePublic(true)}
                                    className={styles.menuItem}
                                >
                                    Make public
                                </MenuItem>
                                <MenuItem
                                    onClick={() => handleBulkMakePublic(false)}
                                    className={styles.menuItem}
                                >
                                    Make Private
                                </MenuItem>
                            </Menu>
                        </div>
                    </div>
                </div>
            )}

            {/* Agent Assignment Modal */}
            <Modal>
                <Modal.Open openWindowName="bulkAssignAgent">
                    <span
                        style={{ display: "none" }}
                        id="bulkAssignAgentModalTrigger"
                    />
                </Modal.Open>
                <Modal.Window name="bulkAssignAgent">
                    <AgentChangeModal
                        staffData={staffData}
                        onChangeAgent={(agentId, onCloseModal) => {
                            handleBulkAgentAssign(agentId);
                            onCloseModal();
                        }}
                        isChangingAgent={isUpdatingBulk}
                    />
                </Modal.Window>
            </Modal>

            <div style={tableStyles.container}>
                <table>
                    <thead>
                        <tr>
                            <th style={{ ...tableStyles.th, width: "50px" }}>
                                <Checkbox
                                    checked={
                                        selectedLeads.length > 0 &&
                                        selectedLeads.length === data?.length
                                    }
                                    indeterminate={
                                        selectedLeads.length > 0 &&
                                        selectedLeads.length < data?.length
                                    }
                                    onChange={handleSelectAll}
                                    size="small"
                                />
                            </th>
                            <th
                                style={{ ...tableStyles.th, width: "120px" }}
                                onClick={() => handleSort()}
                            >
                                Created {sortIcon}
                            </th>
                            <th style={{ ...tableStyles.th, width: "80px" }}>
                                Source
                            </th>
                            <th style={{ ...tableStyles.th, width: "140px" }}>
                                Client Info
                            </th>
                            <th style={{ ...tableStyles.th, width: "60px" }}>
                                Agent
                            </th>
                            <th
                                style={{
                                    ...tableStyles.th,
                                    width: "20px",
                                    backgroundColor: "transparent",
                                    border: "none",
                                }}
                            ></th>
                            <th style={{ ...tableStyles.th, width: "100px" }}>
                                Actions
                            </th>

                            <th style={{ ...tableStyles.th, width: "80px" }}>
                                Classification
                            </th>

                            <th
                                style={{
                                    ...tableStyles.th,
                                    borderBottom: "2px solid #e2e8f0",
                                }}
                            >
                                Preference
                            </th>
                            <th style={{ ...tableStyles.th, width: "80px" }}>
                                Details
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.map((item, index) => (
                            <tr
                                key={item.id}
                                className={styles.tableRow}
                                style={{
                                    ...tableStyles.tr,
                                    backgroundColor:
                                        index % 2 === 0 ? "#ffffff" : "#fafbfc",
                                    borderRadius: "8px",
                                    marginBottom: "4px",
                                }}
                            // onClick={() => handleRowClick(item.id)}
                            >
                                <td
                                    style={{ ...tableStyles.td, width: "50px" }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "4px",
                                        }}
                                    >
                                        <Checkbox
                                            checked={selectedLeads.includes(
                                                item.id
                                            )}
                                            onChange={() =>
                                                handleCheckboxChange(item.id)
                                            }
                                            onClick={(e) => e.stopPropagation()}
                                            size="small"
                                        />
                                        <div
                                            className={`${styles.statusIndicator} ${item?.status === "INACTIVE"
                                                ? styles.statusInactive
                                                : item?.status === "PENDING"
                                                    ? styles.statusPending
                                                    : item?.status ===
                                                        "CONVERTED"
                                                        ? styles.statusConverted
                                                        : styles.statusActive
                                                }`}
                                            title={item?.status || "ACTIVE"}
                                        >
                                            {item?.status === "INACTIVE" ? (
                                                <CancelIcon
                                                    style={{
                                                        fontSize: "16px",
                                                        color: "#dc2626",
                                                    }}
                                                />
                                            ) : item?.status === "PENDING" ? (
                                                <PendingIcon
                                                    style={{
                                                        fontSize: "16px",
                                                        color: "#d97706",
                                                    }}
                                                />
                                            ) : item?.status === "CONVERTED" ? (
                                                <TrendingUpIcon
                                                    style={{
                                                        fontSize: "16px",
                                                        color: "#3730a3",
                                                    }}
                                                />
                                            ) : (
                                                <CheckCircleIcon
                                                    style={{
                                                        fontSize: "16px",
                                                        color: "#166534",
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td style={tableStyles.td}>
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "flex-start",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontWeight: "bold",
                                                fontSize: "11px",
                                                color: "#64748b",
                                                backgroundColor: "#f1f5f9",
                                                padding: "2px 6px",
                                                borderRadius: "4px",
                                                display: "inline-block",
                                            }}
                                        >
                                            {getTimeAgo(
                                                new Date(item?.createTime)
                                            )}
                                        </div>

                                        <div style={{ fontWeight: "500" }}>
                                            {new Date(
                                                item?.createTime
                                            ).toLocaleDateString()}
                                        </div>
                                        <div>
                                            {new Date(
                                                item?.createTime
                                            ).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </div>
                                    </div>
                                </td>
                                <td
                                    style={{ ...tableStyles.td, width: "80px" }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "4px",
                                            height: "40px",
                                            flexDirection: "column",
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
                                                <div
                                                    style={{
                                                        marginLeft: "10px",
                                                    }}
                                                >
                                                    <ClientSourceIcon
                                                        source={
                                                            item?.clientSource
                                                        }
                                                        leadMessage={
                                                            item?.leads_message
                                                        }
                                                        agentName={
                                                            item?.agent?.name
                                                        }
                                                        phoneNumber={
                                                            item?.phone
                                                        }
                                                    />
                                                </div>
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
                                                    fontSize: "17px",
                                                    fontWeight: "600",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                }}
                                            >
                                                {item?.clientSubSource?.toLowerCase() ===
                                                    "whatsapp" && (
                                                        <div
                                                            onClick={() =>
                                                                handleWhatsAppClick(
                                                                    item?.leads_message,
                                                                    item?.agent
                                                                        ?.name,
                                                                    item?.phone,
                                                                    item?.clientType,
                                                                    item
                                                                        ?.preferred_property?.[0]
                                                                )
                                                            }
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "center",
                                                                cursor: "pointer",
                                                                position:
                                                                    "relative",
                                                            }}
                                                            className="whatsapp-tooltip-container"
                                                        >
                                                            <img
                                                                src="/icons/whatsapp.svg"
                                                                alt="whatsapp"
                                                                style={{
                                                                    width: "20px",
                                                                    height: "20px",
                                                                    backgroundColor:
                                                                        "#25D366",
                                                                    borderRadius:
                                                                        "4px",
                                                                    padding: "2px",
                                                                }}
                                                            />
                                                            {item
                                                                ?.whatsapp_delivery_notifications
                                                                ?.length > 0 && (
                                                                    <div
                                                                        className="whatsapp-tooltip"
                                                                        style={{
                                                                            display:
                                                                                "none",
                                                                            position:
                                                                                "absolute",
                                                                            left: "50%",
                                                                            bottom: "-120px",
                                                                            transform:
                                                                                "translateX(-50%)",
                                                                            backgroundColor:
                                                                                "#ffffff",
                                                                            color: "#4b5563",
                                                                            padding:
                                                                                "12px 16px",
                                                                            borderRadius:
                                                                                "8px",
                                                                            fontSize:
                                                                                "14px",
                                                                            whiteSpace:
                                                                                "nowrap",
                                                                            boxShadow:
                                                                                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                                                                            border: "1px solid #e5e7eb",
                                                                        }}
                                                                    >
                                                                        <div
                                                                            style={{
                                                                                display:
                                                                                    "flex",
                                                                                flexDirection:
                                                                                    "column",
                                                                                gap: "4px",
                                                                            }}
                                                                        >
                                                                            {item.whatsapp_delivery_notifications.map(
                                                                                (
                                                                                    notification,
                                                                                    index
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            index
                                                                                        }
                                                                                    >
                                                                                        <span
                                                                                            style={{
                                                                                                fontWeight:
                                                                                                    "500",
                                                                                            }}
                                                                                        >
                                                                                            Status:{" "}
                                                                                        </span>
                                                                                        {
                                                                                            notification.status
                                                                                        }
                                                                                        <br />
                                                                                        <span
                                                                                            style={{
                                                                                                fontWeight:
                                                                                                    "500",
                                                                                            }}
                                                                                        >
                                                                                            Time:{" "}
                                                                                        </span>
                                                                                        {new Date(
                                                                                            notification.created_at
                                                                                        ).toLocaleString()}
                                                                                    </div>
                                                                                )
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                        </div>
                                                    )}
                                                {item?.clientSubSource?.toLowerCase() ===
                                                    "email" && (
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "center",
                                                            }}
                                                        >
                                                            <img
                                                                src="/icons/email.svg"
                                                                alt="email"
                                                                style={{
                                                                    width: "20px",
                                                                    height: "20px",
                                                                    filter: "brightness(0)",
                                                                    borderRadius:
                                                                        "4px",
                                                                    padding: "2px",
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                {item?.clientSubSource !==
                                                    "WhatsApp" &&
                                                    item?.clientSubSource?.toLowerCase() !==
                                                    "email" &&
                                                    capitalizeFirstLetter(
                                                        item?.clientSubSource
                                                    )}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td
                                    style={{
                                        ...tableStyles.td,
                                        width: "140px",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "2px",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontWeight: "500",
                                                display: "flex",
                                                alignItems: "center",
                                                fontSize: "11px",
                                                lineHeight: "1.2",
                                            }}
                                        >
                                            {item?.name}
                                            {item?.email && (
                                                <img
                                                    src="/icons/email.svg"
                                                    alt="email"
                                                    style={{
                                                        marginLeft: 3,
                                                        verticalAlign: "middle",
                                                        opacity: 0.8,
                                                        width: "10px",
                                                        height: "10px",
                                                    }}
                                                />
                                            )}
                                        </span>
                                        <span
                                            style={{
                                                color: "#64748b",
                                                fontSize: "10px",
                                                lineHeight: "1.2",
                                            }}
                                        >
                                            {item?.phone}
                                        </span>

                                        {item?.leads_message && (
                                            <div
                                                style={{
                                                    position: "relative",
                                                    display: "inline-block",
                                                    marginLeft: "6px",
                                                    textDecoration: "underline",
                                                    color: "#2563eb",
                                                }}
                                                className="message-tooltip-container"
                                            >
                                                <span
                                                    style={{
                                                        opacity: 0.8,
                                                        cursor: "pointer",
                                                        fontSize: "9px",
                                                        lineHeight: "1.1",
                                                    }}
                                                >
                                                    see message
                                                </span>
                                                <div
                                                    className="message-tooltip"
                                                    style={{
                                                        display: "none",
                                                        position: "absolute",
                                                        left: "50%",
                                                        bottom: "-20px",
                                                        transform:
                                                            "translateX(-50%)",
                                                        backgroundColor:
                                                            "#ffffff",
                                                        color: "#4b5563",
                                                        padding: "12px 16px",
                                                        borderRadius: "8px",
                                                        fontSize: "14px",
                                                        width: "300px",
                                                        whiteSpace: "normal",
                                                        overflowWrap:
                                                            "break-word",
                                                        wordWrap: "break-word",
                                                        hyphens: "auto",
                                                        boxShadow:
                                                            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                                                        border: "1px solid #e5e7eb",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            justifyContent:
                                                                "space-between",
                                                            alignItems:
                                                                "center",
                                                            marginBottom: "8px",
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                fontWeight:
                                                                    "500",
                                                            }}
                                                        >
                                                            Message:
                                                        </span>
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard
                                                                    .writeText(
                                                                        item?.leads_message ||
                                                                        "N/A"
                                                                    )
                                                                    .then(
                                                                        () => {
                                                                            toast.success(
                                                                                "Message copied to clipboard!"
                                                                            );
                                                                        }
                                                                    )
                                                                    .catch(
                                                                        () => {
                                                                            toast.error(
                                                                                "Failed to copy message"
                                                                            );
                                                                        }
                                                                    );
                                                            }}
                                                            style={{
                                                                padding:
                                                                    "4px 8px",
                                                                backgroundColor:
                                                                    "#f3f4f6",
                                                                border: "1px solid #e5e7eb",
                                                                borderRadius:
                                                                    "4px",
                                                                cursor: "pointer",
                                                                fontSize:
                                                                    "12px",
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: "4px",
                                                            }}
                                                        >
                                                            <img
                                                                src="/icons/copy.svg"
                                                                alt="copy"
                                                                style={{
                                                                    width: "14px",
                                                                    height: "14px",
                                                                    opacity: 0.6,
                                                                }}
                                                            />
                                                            Copy
                                                        </button>
                                                    </div>
                                                    <div
                                                        style={{
                                                            marginTop: "4px",
                                                        }}
                                                    >
                                                        {item?.leads_message ||
                                                            "N/A"}
                                                    </div>
                                                </div>
                                                <style>
                                                    {`
                                                    .message-tooltip-container:hover .message-tooltip,
                                                    .message-tooltip:hover {
                                                        display: block !important;
                                                    }
                                                    `}
                                                </style>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td style={{ ...tableStyles.td, width: "80px" }}>
                                    {hasPermission("assign_leads") ? (
                                        <Modal>
                                            <Modal.Open openWindowName="chooseAgent">
                                                <button
                                                    disabled={isUpdatingLead}
                                                    style={
                                                        tableStyles.agentButton
                                                    }
                                                >
                                                    {item?.agent?.avatar ? (
                                                        <img
                                                            src={
                                                                item?.agent
                                                                    ?.avatar
                                                            }
                                                            style={{
                                                                width: "20px",
                                                                height: "20px",
                                                                borderRadius:
                                                                    "50%",
                                                                objectFit:
                                                                    "cover",
                                                                marginRight:
                                                                    "2px",
                                                            }}
                                                        />
                                                    ) : (
                                                        <span
                                                            style={{
                                                                marginRight:
                                                                    "2px",
                                                                fontSize:
                                                                    "10px",
                                                            }}
                                                        >
                                                            {item?.agent?.name}
                                                        </span>
                                                    )}
                                                    <img
                                                        src="/icons/chevron-down.svg"
                                                        style={{
                                                            width: "10px",
                                                            height: "10px",
                                                            opacity: 0.5,
                                                        }}
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
                                                            item.id,
                                                            onCloseModal
                                                        )
                                                    }
                                                    isChangingAgent={
                                                        isUpdatingLead
                                                    }
                                                />
                                            </Modal.Window>
                                        </Modal>
                                    ) : item.status === "POOL" ? (
                                        <button
                                            disabled={isUpdatingLead}
                                            onClick={() => handleClaim(item.id)}
                                            style={{
                                                ...tableStyles.agentButton,
                                                background: "#22c55e",
                                                color: "white",
                                                border: "none",
                                                justifyContent: "center",
                                            }}
                                        >
                                            Claim
                                        </button>
                                    ) : (
                                        <div style={tableStyles.agentButton}>
                                            {item?.agent?.avatar ? (
                                                <img
                                                    src={item?.agent?.avatar}
                                                    style={{
                                                        width: "20px",
                                                        height: "20px",
                                                        borderRadius: "50%",
                                                        objectFit: "cover",
                                                        marginRight: "2px",
                                                    }}
                                                />
                                            ) : (
                                                <span
                                                    style={{
                                                        marginRight: "2px",
                                                        fontSize: "10px",
                                                    }}
                                                >
                                                    {item?.agent?.name ||
                                                        "N/A"}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td
                                    style={{
                                        ...tableStyles.td,
                                        width: "20px",
                                        backgroundColor: "transparent",
                                        border: "none",
                                    }}
                                ></td>
                                <td
                                    style={{
                                        ...tableStyles.td,
                                        width: "100px",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            flexDirection: "row",
                                        }}
                                    >
                                        <div className={styles.actionButton}>
                                            <AddLeadFollowup
                                                type="lead"
                                                targetId={item?.id}
                                                comment={item?.comment}
                                            />
                                        </div>
                                    </div>
                                </td>

                                <td
                                    style={{ ...tableStyles.td, width: "80px" }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "8px",
                                        }}
                                    >
                                        <LeadsItemStage
                                            leadData={item}
                                            target_id={item?.id}
                                        />
                                        <LeadItemTag leadData={item} />
                                        <LeadsItemGroups leadData={item} />
                                    </div>
                                </td>
                                <td style={tableStyles.td}>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <div>
                                            {item?.property_type?.length !==
                                                0 && (
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            flexWrap: "wrap",
                                                            gap: "4px",
                                                            marginBottom: "8px",
                                                        }}
                                                    >
                                                        {item?.property_type?.map(
                                                            (type, index) => (
                                                                <span
                                                                    key={index}
                                                                    style={{
                                                                        display:
                                                                            "inline-block",
                                                                        padding:
                                                                            "2px 8px",
                                                                        backgroundColor:
                                                                            "#f1f5f9",
                                                                        color: "#000000",
                                                                        borderRadius:
                                                                            "4px",
                                                                        fontSize:
                                                                            "11px",
                                                                        fontWeight:
                                                                            "500",
                                                                        border: "1px solid #e2e8f0",
                                                                    }}
                                                                >
                                                                    {type}
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                )}

                                            {item?.preferred_property_details
                                                ?.length !== 0
                                                ? item?.preferred_property_details?.map(
                                                    (data) => (
                                                        <div
                                                            key={data?.id}
                                                            style={{
                                                                position:
                                                                    "relative",
                                                                display:
                                                                    "inline-block",
                                                                marginRight:
                                                                    "2px",
                                                            }}
                                                        >
                                                            <span
                                                                onClick={() =>
                                                                    handlePreferredPropertyClick(
                                                                        data?.id,
                                                                        item?.clientType
                                                                    )
                                                                }
                                                                style={{
                                                                    cursor: "pointer",
                                                                    color: "#2563eb",
                                                                    textDecoration:
                                                                        "underline",
                                                                }}
                                                            >
                                                                {data?.title}
                                                            </span>
                                                            <div
                                                                style={{
                                                                    position:
                                                                        "absolute",
                                                                    bottom: "auto",
                                                                    top: "7rem",
                                                                    left: "-8rem",
                                                                    backgroundColor:
                                                                        "white",
                                                                    padding:
                                                                        "10px",
                                                                    borderRadius:
                                                                        "4px",
                                                                    boxShadow:
                                                                        "0 2px 10px rgba(0,0,0,0.1)",
                                                                    minWidth:
                                                                        "250px",
                                                                    display:
                                                                        "none",
                                                                    border: "1px solid #eee",
                                                                }}
                                                                className="tooltip"
                                                            >
                                                                <p>
                                                                    <strong>
                                                                        Title:
                                                                    </strong>{" "}
                                                                    {
                                                                        data?.title
                                                                    }
                                                                </p>
                                                                <p>
                                                                    <strong>
                                                                        Type:
                                                                    </strong>{" "}
                                                                    {
                                                                        data?.listingType
                                                                    }
                                                                </p>
                                                                <p>
                                                                    <strong>
                                                                        Price:
                                                                    </strong>{" "}
                                                                    {
                                                                        data?.price
                                                                    }{" "}
                                                                    /{" "}
                                                                    {
                                                                        data?.priceType
                                                                    }
                                                                </p>
                                                                <p>
                                                                    <strong>
                                                                        Bedrooms:
                                                                    </strong>{" "}
                                                                    {data?.bedrooms ||
                                                                        "N/A"}
                                                                </p>
                                                                <p>
                                                                    <strong>
                                                                        Bathrooms:
                                                                    </strong>{" "}
                                                                    {data?.bathrooms ||
                                                                        "N/A"}
                                                                </p>
                                                                <p>
                                                                    <strong>
                                                                        Location:
                                                                    </strong>{" "}
                                                                    {data
                                                                        ?.location
                                                                        ?.city
                                                                        ? `${data?.location?.city}${data?.location?.community ? `, ${data?.location?.community}` : ""}${data?.location?.sub_community ? `, ${data?.location?.sub_community}` : ""}`
                                                                        : "N/A"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )
                                                )
                                                : "-"}
                                        </div>
                                    </div>
                                    <style>{`
                                        @keyframes pulse {
                                            0% { transform: translateX(0); }
                                            50% { transform: translateX(3px); }
                                            100% { transform: translateX(0); }
                                        }
                                    `}</style>
                                    <style>
                                        {`
                                        td div:hover .tooltip {
                                            display: block !important;
                                        }
                                        .whatsapp-tooltip-container:hover .whatsapp-tooltip {
                                            display: block !important;
                                        }
                                        `}
                                    </style>

                                    <div>
                                        {item?.location && (
                                            <div
                                                style={{
                                                    color: "#6b7280",
                                                    fontSize: "12px",
                                                    opacity: 0.8,
                                                }}
                                            >
                                                {item.location.sub_community}
                                                <span>, </span>
                                                {item.location.community}
                                                {/* <span>, </span> */}
                                                {/* {item.location.city} */}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td
                                    style={{ ...tableStyles.td, width: "80px" }}
                                >
                                    {item?.last_followup?.agent_id && (
                                        <LeadTableCell
                                            item={item?.last_followup}
                                        />
                                    )}

                                    <div className={styles.actionButton}>
                                        <LeadDetailsModal leadData={item} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isFetchingNextPage && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        padding: "2rem",
                        backgroundColor: "transparent",
                        position: "sticky",
                        bottom: 0,
                        left: 0,
                        right: 0,
                    }}
                >
                    <Spinner />
                </div>
            )}
        </>
    );
}
