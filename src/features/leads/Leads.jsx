import { useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import Spinner from "../../ui/Spinner";
import styles from "../../styles/Leads.module.css";
import { useNavigate } from "react-router-dom";
import { formatNum, getDaysFromCurrentDate } from "../../utils/utils";
import LeadItemTag from "./LeadItemTag";
import useInfiniteLeads from "./useInfiniteLeads";
import ClientSourceIcon from "../../components/ClientSourceIcon";

import useUpdateLead from "./useUpdateLead";
import useAllDetails from "../all-details/useAllDetails";
import { useMyPermissions } from "../../hooks/useHasPermission";

function Leads({ leadType, containerRef, data: passedLeads, fetchNextPage, hasNextPage, isFetchingNextPage }) {
    const navigate = useNavigate();
    const {
        isLoading,
        leads: hookLeads,
        error
    } = useInfiniteLeads(leadType);

    const { changeLead, isPending: isUpdatingLead } = useUpdateLead();
    const { hasPermission } = useMyPermissions();
    const { data: allDetails } = useAllDetails();
    const currentUserId = allDetails?.current_user_details?.id;

    const handleClaim = (e, leadId) => {
        e.stopPropagation();
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

    const leads = passedLeads || hookLeads;

    useEffect(() => {
        if (error) toast.error(error.message);
    }, [error]);

    const handleScroll = useCallback(() => {
        if (!containerRef?.current) return;

        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100;

        if (scrollPercentage > 80 && hasNextPage && !isFetchingNextPage) {
            const currentPage = leads?.page || 0;
            const totalPages = leads?.totalPages || 0;

            if (currentPage < totalPages) {
                fetchNextPage();
            }
        }
    }, [hasNextPage, fetchNextPage, isFetchingNextPage, containerRef, leads]);

    useEffect(() => {
        const container = containerRef?.current;
        if (!container) return;

        container.addEventListener("scroll", handleScroll);
        return () => {
            container.removeEventListener("scroll", handleScroll);
        };
    }, [handleScroll, containerRef]);

    if (isLoading) return <div className={styles.spinnerContainer}><Spinner type="fullPage" /></div>;

    return (
        <div>
            <div className={styles.leads} >
                {leads.map((item) => (
                    <div className={styles.leadItem} key={item.id} onClick={() => navigate(`/leads/details/${item.id}`)}>
                        <div className={styles.leadContent}>
                            <div className={styles.leadTop}>
                                <h2>{item.name}</h2>
                                <div className={styles.leadTopRight}>

                                    <LeadItemTag leadData={item} />
                                    <span>
                                        {`${getDaysFromCurrentDate(item.createTime)} days ago`}
                                    </span>
                                </div>
                            </div>
                            <ul>
                                <li >
                                    <span>Budget</span>
                                    <span>{`${item.budgetFrom ? formatNum(item.budgetFrom) : "N/A"}-${item.budgetTo ? formatNum(item.budgetTo) + " AED" : "N/A"}`}</span>
                                </li>
                                <li>
                                    <span>Location</span>
                                    <span>
                                        {item.areas?.length !== 0
                                            ? item.areas?.map?.((obj) => (
                                                <span key={obj.id}>
                                                    {obj.name}
                                                    <br />
                                                </span>
                                            ))
                                            : "N/A"}
                                    </span>
                                </li>
                                <li>
                                    <span>Nationality</span>
                                    <span>{item.nationality || "N/A"}</span>
                                </li>
                                <li>
                                    <span>Source</span>
                                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <ClientSourceIcon
                                            source={item?.clientSource}
                                            leadMessage={item?.leads_message}
                                            agentName={item?.agent?.name}
                                            phoneNumber={item?.phone}
                                        />
                                        {item?.clientSubSource?.toLowerCase() === "whatsapp" && (
                                            <img
                                                src="/icons/whatsapp/whatsapp.svg"
                                                alt="whatsapp"
                                                style={{
                                                    width: "20px",
                                                    height: "20px",
                                                    backgroundColor: "#25D366",
                                                    borderRadius: "4px",
                                                    padding: "2px",
                                                }}
                                            />
                                        )}
                                        {item?.clientSubSource?.toLowerCase() === "email" && (
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
                                        )}
                                    </span>
                                </li>
                                <li>
                                    <span>Property Type</span>
                                    <span>
                                        {item.property_type?.length !== 0
                                            ? item.property_type?.join?.(
                                                ", "
                                            )
                                            : "N/A"}
                                    </span>
                                </li>
                                {leadType === "SELL" && (
                                    <li>
                                        <span>Project Type</span>
                                        <span>
                                            {item.projectType || "N/A"}
                                        </span>
                                    </li>
                                )}
                                <li>
                                    <span>Preferred Rooms</span>
                                    <span>{`${item.roomsFrom ? item.roomsFrom : "N/A"}-${item.roomsTo ? item.roomsTo : "N/A"}`}</span>
                                </li>
                                <li>
                                    <span>Agent</span>
                                    <span>
                                        {!hasPermission("assign_leads") && item.status === "POOL" ? (
                                            <button
                                                disabled={isUpdatingLead}
                                                onClick={(e) => handleClaim(e, item.id)}
                                                style={{
                                                    backgroundColor: "#22c55e",
                                                    color: "white",
                                                    border: "none",
                                                    padding: "2px 8px",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                    fontSize: "12px",
                                                    zIndex: 10
                                                }}
                                            >
                                                Claim
                                            </button>
                                        ) : (
                                            item?.agent?.name || "N/A"
                                        )}
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
            {isFetchingNextPage && (
                <div className={styles.spinnerContainer}>
                    <Spinner />
                </div>
            )}
        </div>
    );
}

export default Leads;
