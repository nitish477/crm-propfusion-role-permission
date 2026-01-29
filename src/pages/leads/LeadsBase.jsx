import Leads from "../../features/leads/Leads";
import LeadsFilter from "../../features/leads/LeadsFilter";
import useInfiniteLeads from "../../features/leads/useInfiniteLeads";
import ExtraFilters from "../../ui/ExtraFilters";
import SectionTop from "../../ui/SectionTop";
import LeadsBaseTable from "./LeadsBaseTable";
import LeadsMapView from "./LeadsMapView";
import { useSearchParams } from "react-router-dom";
import SimpleTabs from "../../ui/SimpleTabs";
import ToggleButton from "../../ui/ToggleButton";
import { Search, Table2, Grid, PieChart, Map } from "lucide-react";
import AddButtonToNavigateForms from "../../ui/AddButtonToNavigateForms";
import { useRef, useCallback, useEffect, useState } from "react";
import ScrollToTop from "../../ui/ScrollToTop";
import LeadBasedOnStage from "./LeadBasedonStage";
import Filter from "../../ui/Filter";
import { useMyPermissions } from "../../hooks/useHasPermission";
import useAllDetails from "../../features/all-details/useAllDetails";
import { updateStaff } from "../../services/apiStaff";

function LeadsBase() {
    const { data } = useAllDetails();
    const [leadType, setLeadType] = useState("SELL");
    const [isTabSwitching, setIsTabSwitching] = useState(false);
    const {
        isLoading,
        leads,
        error,
        totalSize,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
    } = useInfiniteLeads(leadType);
    const [searchParams, setSearchParams] = useSearchParams();
    const viewType =
        searchParams.get("viewType") ||
        data?.current_user_details?.leads_default_view;
    const containerRef = useRef(null);
    const { hasPermission } = useMyPermissions();
    // Ensure viewType is set in URL params when page loads
    useEffect(() => {
        if (
            !searchParams.has("viewType") &&
            data?.current_user_details?.leads_default_view
        ) {
            searchParams.set(
                "viewType",
                data?.current_user_details?.leads_default_view
            );
            setSearchParams(searchParams);
        } else if (searchParams.get("viewType") !== viewType) {
            // Update the store if URL has a different view type
        }
    }, [
        searchParams,
        setSearchParams,
        data?.current_user_details?.leads_default_view,
        viewType,
    ]);

    const handleTabChange = (newType) => {
        setIsTabSwitching(true);
        setLeadType(newType);
    };

    const handleScroll = useCallback(() => {
        if (!containerRef?.current) return;

        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        const scrollPercentage =
            (scrollTop / (scrollHeight - clientHeight)) * 100;

        if (scrollPercentage > 80 && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [containerRef, hasNextPage, isFetchingNextPage, fetchNextPage]);

    useEffect(() => {
        const currentRef = containerRef?.current;
        if (!currentRef) return;

        currentRef.addEventListener("scroll", handleScroll);
        return () => currentRef.removeEventListener("scroll", handleScroll);
    }, [containerRef, handleScroll]);

    const handleLoadMore = useCallback(() => {
        if (!isFetchingNextPage && hasNextPage) {
            const currentPage = leads?.page || 0;
            const totalPages = leads?.totalPages || 0;

            if (currentPage < totalPages) {
                fetchNextPage();
            }
        }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage, leads]);

    const handleViewChange = async (newViewType) => {
        searchParams.set("viewType", newViewType);
        setSearchParams(searchParams);
        const payload = {
            leads_default_view: newViewType,
        };
        updateStaff(data?.current_user_details?.id, payload);
        // setLeadView(newViewType);
    };

    const getViewIcon = (viewType) => {
        switch (viewType) {
            case "list":
                return <Table2 size={20} />;
            case "card":
                return <Grid size={20} />;
            case "pipeline":
                return <PieChart size={20} />;
            case "map":
                return <Map size={20} />;
            default:
                return <Table2 size={20} />;
        }
    };

    return (
        <div className="sectionContainer">
            <SectionTop
                heading={`${leadType[0] + leadType.toLowerCase().slice(1)} Leads`}
            >
                <SimpleTabs
                    tabs={[
                        { id: "SELL", label: "Buy Leads", bgColor: "#f5f5f5" },
                        { id: "RENT", label: "Rent Leads", bgColor: "#f5f5f5" },
                        {
                            id: "UNDEFINED",
                            label: "Undefined Leads",
                            bgColor: "#f5f5f5",
                        },
                        {
                            id: "ENQUIRY",
                            label: "Enquiry Leads",
                            bgColor: "#f5f5f5",
                        },
                        {
                            id: "EDUCATION",
                            label: "Education Leads",
                            bgColor: "#f5f5f5",
                        },
                       
                        { id: "", label: "All Leads", bgColor: "#f5f5f5" },
                    ]}
                    activeTab={leadType}
                    onTabChange={handleTabChange}
                    isLoading={isTabSwitching}
                />
            </SectionTop>

            <section
                ref={containerRef}
                className="sectionStyles"
                style={{
                    paddingTop: "4rem",
                    paddingLeft: "3rem",
                    backgroundColor: "#ffffff",
                    height: "calc(100vh)",
                    overflowY: "auto",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                }}
            >
                <style>
                    {`
                        .sectionStyles::-webkit-scrollbar {
                            display: none;
                        }
                    `}
                </style>
                <div>
                    <ToggleButton>
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "1rem",
                                marginBottom: "1rem",
                                paddingTop: "4rem",
                            }}
                        >
                            <ExtraFilters
                                buttonOptions={[
                                    { label: "Active Leads", value: "ACTIVE" },
                                    { label: "Closed Deal", value: "DEAL" },
                                    { label: "Pool", value: "POOL" },
                                    ...(hasPermission("manage_leads")
                                        ? [
                                              {
                                                  label: "Inactive Leads",
                                                  value: "INACTIVE",
                                              },
                                          ]
                                        : []),
                                    { label: "Draft Leads", value: "DRAFT" },
                                ]}
                                totalSize={totalSize}
                                leadType={leadType}
                            />
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "1rem",
                                    flexWrap: "wrap",
                                }}
                            >
                                <Filter
                                    showReset={false}
                                    smallHandleResetBtn={true}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "1rem",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Filter.InputDataList
                                            placeholder="Source"
                                            registerName="client_sub_source"
                                            data={[
                                                {
                                                    label: "Whatsapp",
                                                    value: "WhatsApp",
                                                },
                                                {
                                                    label: "Email",
                                                    value: "email",
                                                },
                                            ]}
                                            isCreatable
                                        />
                                    </div>
                                </Filter>
                                <ToggleButton.Button
                                    label="Advanced Filter"
                                    icon={<Search />}
                                    style={{
                                        "--toggleBtn-primary": "#000",
                                        border: "1px solid #000",
                                        backgroundColor: "transparent",
                                        padding: "0.5rem 1rem",
                                        borderRadius: "0.5rem",
                                        color: "#000",
                                    }}
                                />
                                {hasPermission("create_leads") && (
                                    <AddButtonToNavigateForms />
                                )}
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "0.5rem",
                                        border: "1px solid #e0e0e0",
                                        borderRadius: "0.5rem",
                                        padding: "0.2rem",
                                        background: "white",
                                    }}
                                >
                                    {["list", "card", "pipeline", "map"].map(
                                        (type) => (
                                            <button
                                                key={type}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    padding: "0.6rem 1.2rem",
                                                    borderRadius: "0.3rem",
                                                    cursor: "pointer",
                                                    fontSize: "1.4rem",
                                                    fontWeight: "500",
                                                    gap: "0.8rem",
                                                    background:
                                                        viewType === type
                                                            ? "#f5f5f5"
                                                            : "transparent",
                                                    border: "none",
                                                    transition: "all 0.2s ease",
                                                }}
                                                onClick={() =>
                                                    handleViewChange(type)
                                                }
                                            >
                                                {getViewIcon(type)}
                                                {/* {getViewLabel(type)} */}
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                        <ToggleButton.Content>
                            <div
                                className="LEADSfilter"
                                style={{
                                    padding: "1.5rem",
                                    borderTop: "1px solid #eee",
                                    backgroundColor: "transparent !important",
                                }}
                            >
                                <LeadsFilter />
                            </div>
                        </ToggleButton.Content>
                    </ToggleButton>

                    {viewType === "list" ? (
                        <LeadsBaseTable
                            leadType={leadType}
                            data={leads}
                            error={error}
                            totalSize={totalSize}
                            isLoading={isLoading}
                            containerRef={containerRef}
                            hasNextPage={hasNextPage}
                            fetchNextPage={fetchNextPage}
                            isFetchingNextPage={isFetchingNextPage}
                            refetch={refetch}
                        />
                    ) : viewType === "card" ? (
                        <Leads
                            leadType={leadType}
                            isLoading={isLoading}
                            error={error}
                            data={leads}
                            totalSize={totalSize}
                            containerRef={containerRef}
                            hasNextPage={hasNextPage}
                            fetchNextPage={fetchNextPage}
                            isFetchingNextPage={isFetchingNextPage}
                        />
                    ) : viewType === "map" ? (
                        <LeadsMapView
                            leadType={leadType}
                            data={leads}
                            error={error}
                            totalSize={totalSize}
                            containerRef={containerRef}
                            hasNextPage={hasNextPage}
                            fetchNextPage={fetchNextPage}
                            isFetchingNextPage={isFetchingNextPage}
                        />
                    ) : (
                        <LeadBasedOnStage
                            data={leads}
                            isLoading={isLoading}
                            totalSize={totalSize}
                            containerRef={containerRef}
                            onLoadMore={handleLoadMore}
                            isFetchingNextPage={isFetchingNextPage}
                        />
                    )}
                </div>
            </section>
            <ScrollToTop containerRef={containerRef} />
        </div>
    );
}

export default LeadsBase;
