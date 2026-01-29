/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import styles from "../../styles/Leads.module.css";
import useLead from "../../features/leads/useLead";
import toast from "react-hot-toast";
import SectionTop from "../../ui/SectionTop";
import Spinner from "../../ui/Spinner";
import {
    formatLocationsForMetaAds,
    formatNum,
    getDaysFromCurrentDate,
} from "../../utils/utils";
import DeleteLead from "../../features/leads/DeleteLead";
import PageNotFound from "../PageNotFound";
import useUpdateLead from "../../features/leads/useUpdateLead";
import { useNavigate } from "react-router-dom";
import FollowUps from "../../features/followUps/FollowUps";
import Modal from "../../ui/Modal";
import AgentChangeModal from "../../ui/AgentChangeModal";
import useStaff from "../../features/admin/staff/useStaff";
import Breadcrumb from "../../ui/Breadcrumb";
import useStages from "../../features/stages/useStages";
import useFollowUps from "../../features/followUps/useFollowUps";
import Notes from "../../features/notes/Notes";
import useLeadLogs from "../../features/leads/useLeadLogs";
import Logs from "./Logs";
import PreferredProperty from "../../features/leads/PrefredPropert";
import PreferredDeveloper from "../../features/leads/PreferredDeveloper";
import PreferredProject from "../../features/leads/PreferredProject";
import LeadMessage from "../../features/leads/LeadMessage";
import { useForm } from "react-hook-form";
import FormInputDataList from "../../ui/FormInputDataList";
import FormInputSelect from "../../ui/FormInputSelect";
import {
    PROPERTY_TYPES,
    BEDROOM_NUM_OPTIONS,
    NUM_OPTIONS,
} from "../../utils/constants";
import {
    ChevronDown,
    ChevronRight,
    Hash,
    Wallet,
    MessageSquare,
    MapPin,
    Phone,
    PhoneCall,
    Mail,
    Flag,
    Link,
    Home,
    Building2,
    Activity,
    Hotel,
    Bath,
    DollarSign,
    CheckSquare,
    FileText,
    Building,
    LandPlot,
    Users,
    CalendarDays,
    CalendarClock,
    Edit,
} from "lucide-react";
import { useMyPermissions } from "../../hooks/useHasPermission";
import ClientSourceIcon from "../../components/ClientSourceIcon";
import PropertyReference from "../../features/leads/PropertyReference";
import AIPropertySuggestions from "../../features/leads/AIPropertySuggestions";
import FormInputAsyncDataList from "../../ui/FormInputAsyncDataList";
import { getLocations } from "../../services/apiProperties";
import FormInputCountries from "../../ui/FormInputCountries";
import { useAuth } from "../../context/AuthContext";
import useAllDetails from "../../features/all-details/useAllDetails";
import moment from "moment";

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "2-digit",
    });
}

function LeadDetails() {
    const { hasPermission } = useMyPermissions();
    const [openLocationModal, setOpenLocationModal] = useState(false);
    const [openPhoneModal, setOpenPhoneModal] = useState(false);
    const [openSecondaryPhoneModal, setOpenSecondaryPhoneModal] =
        useState(false);
    const [openEmailModal, setOpenEmailModal] = useState(false);
    const [openNationalityModal, setOpenNationalityModal] = useState(false);
    const [openPropertyTypeModal, setOpenPropertyTypeModal] = useState(false);
    const [openRoomsModal, setOpenRoomsModal] = useState(false);
    const [openBathroomModal, setOpenBathroomModal] = useState(false);
    const [openBudgetModal, setOpenBudgetModal] = useState(false);
    const [isExtraFieldsExpanded, setIsExtraFieldsExpanded] = useState(false);
    const {
        control,
        handleSubmit,
        setValue,
        register,
        formState: { errors },
    } = useForm({
        defaultValues: {
            location: null,
            phone: "",
            secondaryPhone: "",
            email: "",
            nationality: null,
            propertyType: [],
            roomsFrom: "",
            roomsTo: "",
            from_bathroom: "",
            to_bathroom: "",
            budgetFrom: "",
            budgetTo: "",
        },
    });
    const { data: companyData } = useAllDetails();
    const { data: leadData, isLoading: isLoadingLead, error } = useLead();
    const { changeLead, isPending: isUpdatingLead } = useUpdateLead();
    const { data: staffData, isLoading: isLoadingStaff } = useStaff();
    const {
        data: leadLogs,
        isPending: leadLogsPending,
        error: leadLogsError,
    } = useLeadLogs();
    const {
        data: stageData,
        isLoading: isLoadingStages,
        error: errorStages,
    } = useStages("leads");
    const {
        isLoading,
        data,
        error: errorFollowUps,
    } = useFollowUps("lead", leadData[0]?.id);

    const navigate = useNavigate();

    const companyName = companyData?.company_settings?.company_name;

    useEffect(() => {
        if (error) toast.error(error.message);
    }, [error]);

    useEffect(() => {
        if (leadData?.[0]?.location) {
            setValue("location", {
                value: leadData[0].location,
                label: [
                    leadData[0].location.city,
                    leadData[0].location.community,
                    leadData[0].location.sub_community,
                    leadData[0].location.property_name,
                ]
                    .filter(Boolean)
                    .join(", "),
            });
        }
    }, [leadData, setValue]);

    const onSubmit = (data) => {
        if (!data.location?.value) return;

        changeLead({
            id: leadData[0]?.id,
            payload: {
                ...leadData[0],
                location: data.location.value,
            },
        });
        setOpenLocationModal(false);
    };

    function handleClaim() {
        changeLead({
            id: leadData[0]?.id,
            payload: { ...leadData[0], isClaim: "YES" },
        });
    }

    function handleDealLead() {
        changeLead({
            id: leadData[0]?.id,
            payload: { ...leadData[0], status: "DEAL" },
        });
    }

    function handleStatusChange(status) {
        changeLead({
            id: leadData[0]?.id,
            payload: { ...leadData[0], status },
        });
    }

    function handleChangePublic(is_public) {
        changeLead({
            id: leadData[0]?.id,
            payload: { ...leadData[0], is_public },
        });
    }

    function handleChangeAgent(agentId, onCloseModal) {
        changeLead(
            {
                id: leadData[0]?.id,
                payload: { ...leadData[0], agent_Id: agentId },
            },
            {
                onSettled: onCloseModal,
            }
        );
    }

    if (isLoadingLead) return <Spinner type="fullPage" />;

    if (leadData?.length === 0) return <PageNotFound />;

    const modifiedStages = stageData?.map((stage) => ({
        label: stage?.name,
        value: stage?.id,
    }));

    const stage = leadData[0]?.latest_followup?.stages;
    return (
        <div className="sectionContainer">
            <SectionTop heading="Lead Details" />

            <section className={`${styles.leadDetails} sectionStyles`}>
                {(data?.[0]?.stage_data?.name ||
                    data?.[0]?.rating_data?.name) && (
                        <div className="sectionDiv">
                            <div>
                                <span
                                    style={{
                                        fontWeight: 600,
                                        color: data?.[0]?.stage_data?.color_code,
                                        borderColor:
                                            data?.[0]?.stage_data?.color_code,
                                        border: "1px solid",
                                        padding: "5px 10px",
                                        borderRadius: "8px",
                                    }}
                                >
                                    {data?.[0]?.stage_data?.name}
                                </span>
                                <span
                                    style={{
                                        marginLeft: "10px",
                                        fontWeight: 600,
                                        color: data?.[0]?.rating_data?.color_code,
                                        borderColor:
                                            data?.[0]?.rating_data?.color_code,
                                        border: "1px solid",
                                        padding: "5px 10px",
                                        borderRadius: "8px",
                                    }}
                                >
                                    {data?.[0]?.rating_data?.name}
                                </span>
                                <span
                                    style={{
                                        marginLeft: "10px",
                                        fontWeight: 600,
                                        color: data?.[0]?.rating_data?.color_code,
                                        borderColor:
                                            data?.[0]?.rating_data?.color_code,
                                        border: "1px solid",
                                        padding: "5px 10px",
                                        borderRadius: "8px",
                                    }}
                                >
                                    {leadData?.[0]?.is_public
                                        ? "Public"
                                        : "Private"}
                                </span>
                            </div>
                        </div>
                    )}
                <div className="sectionDiv">
                    <Breadcrumb
                        loading={isLoadingStages}
                        items={modifiedStages}
                        filter={(item) => item.value !== Number(stage)}
                    />
                </div>
                <div className="sectionDiv">
                    <div key={leadData[0]?.id}>
                        <div className={styles.leadContent}>
                            <div className={styles.leadTop}>
                                <h2>{leadData[0]?.name}</h2>
                                <span>
                                    {`${getDaysFromCurrentDate(leadData[0]?.createTime)} days ago`}
                                </span>
                            </div>
                            <ul>
                                <li>
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        <Hash
                                            className="icon"
                                            style={{
                                                width: "16px",
                                                height: "16px",
                                            }}
                                        />{" "}
                                        Lead ID
                                    </span>
                                    <span>{leadData[0]?.id || "N/A"}</span>
                                </li>

                                <li
                                    style={{
                                        overflowX: "auto",
                                        whiteSpace: "nowrap",
                                        display: "flex",
                                        scrollbarWidth: "thin",
                                        scrollbarColor: " #ccc #f5f5f",
                                        maxWidth: "100%",
                                    }}
                                >
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        <MessageSquare className="icon" /> Wp
                                        Lead ID
                                    </span>
                                    <span>{`${leadData[0]?.whatsapp_lead_id ? leadData[0]?.whatsapp_lead_id : "N/A"}  `}</span>
                                </li>
                                <li>
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        <MapPin className="icon" /> Location
                                        <button
                                            onClick={() =>
                                                setOpenLocationModal(true)
                                            }
                                            style={{
                                                border: "none",
                                                background: "transparent",
                                                cursor: "pointer",
                                                padding: "4px",
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <Edit size={16} />
                                        </button>
                                    </span>
                                    <span>
                                        {leadData[0]?.location
                                            ? [
                                                leadData[0]?.location?.city,
                                                leadData[0]?.location
                                                    ?.community,
                                                leadData[0]?.location
                                                    ?.sub_community,
                                                leadData[0]?.location
                                                    ?.property_name,
                                            ]
                                                .filter(Boolean)
                                                .join(", ") || "N/A"
                                            : "N/A"}
                                    </span>
                                </li>
                                <li>
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        <Phone className="icon" /> Phone
                                        <button
                                            onClick={() => {
                                                setValue(
                                                    "phone",
                                                    leadData[0]?.phone || ""
                                                );
                                                setOpenPhoneModal(true);
                                            }}
                                            style={{
                                                border: "none",
                                                background: "transparent",
                                                cursor: "pointer",
                                                padding: "4px",
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <Edit size={16} />
                                        </button>
                                    </span>
                                    <span>{leadData[0]?.phone || "N/A"}</span>
                                </li>
                                <li>
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        <PhoneCall className="icon" /> Secondary
                                        Phone
                                        <button
                                            onClick={() => {
                                                setValue(
                                                    "secondaryPhone",
                                                    leadData[0]
                                                        ?.secondryPhone || ""
                                                );
                                                setOpenSecondaryPhoneModal(
                                                    true
                                                );
                                            }}
                                            style={{
                                                border: "none",
                                                background: "transparent",
                                                cursor: "pointer",
                                                padding: "4px",
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <Edit size={16} />
                                        </button>
                                    </span>
                                    <span>
                                        {leadData[0]?.secondryPhone || "N/A"}
                                    </span>
                                </li>
                                <li>
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        <Mail className="icon" /> Email
                                        <button
                                            onClick={() => {
                                                setValue(
                                                    "email",
                                                    leadData[0]?.email || ""
                                                );
                                                setOpenEmailModal(true);
                                            }}
                                            style={{
                                                border: "none",
                                                background: "transparent",
                                                cursor: "pointer",
                                                padding: "4px",
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <Edit size={16} />
                                        </button>
                                    </span>
                                    <span>{leadData[0]?.email || "N/A"}</span>
                                </li>
                                <li>
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        <Flag className="icon" /> Nationality
                                        <button
                                            onClick={() => {
                                                setValue(
                                                    "nationality",
                                                    leadData[0]?.nationality
                                                        ? {
                                                            value: leadData[0]
                                                                .nationality,
                                                            label: leadData[0]
                                                                .nationality,
                                                        }
                                                        : null
                                                );
                                                setOpenNationalityModal(true);
                                            }}
                                            style={{
                                                border: "none",
                                                background: "transparent",
                                                cursor: "pointer",
                                                padding: "4px",
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <Edit size={16} />
                                        </button>
                                    </span>
                                    <span>
                                        {leadData[0]?.nationality || "N/A"}
                                    </span>
                                </li>
                                <li>
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        <Link className="icon" /> Source
                                    </span>
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        <ClientSourceIcon
                                            source={leadData[0]?.clientSource}
                                            leadMessage={
                                                leadData[0]?.leads_message
                                            }
                                            agentName={leadData[0]?.agent?.name}
                                            phoneNumber={leadData[0]?.phone}
                                        />
                                        {leadData[0]?.clientSubSource?.toLowerCase() ===
                                            "whatsapp" && (
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
                                        {leadData[0]?.clientSubSource?.toLowerCase() ===
                                            "email" && (
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
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        <Home className="icon" /> Property Type
                                        <button
                                            onClick={() => {
                                                setValue(
                                                    "propertyType",
                                                    leadData[0]?.property_type?.map(
                                                        (type) => ({
                                                            value: type,
                                                            label: type,
                                                        })
                                                    ) || []
                                                );
                                                setOpenPropertyTypeModal(true);
                                            }}
                                            style={{
                                                border: "none",
                                                background: "transparent",
                                                cursor: "pointer",
                                                padding: "4px",
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <Edit size={16} />
                                        </button>
                                    </span>
                                    <span>
                                        {leadData[0]?.property_type?.length !==
                                            0
                                            ? leadData[0]?.property_type?.join?.(
                                                ", "
                                            )
                                            : "N/A"}
                                    </span>
                                </li>
                                {leadData[0]?.clientType === "SELL" && (
                                    <li>
                                        <span
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                            }}
                                        >
                                            <Building2 className="icon" />{" "}
                                            Project Type
                                        </span>
                                        <span>
                                            {leadData[0]?.projectType || "N/A"}
                                        </span>
                                    </li>
                                )}
                                <li>
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        <Activity className="icon" /> Status
                                    </span>
                                    <span>{`${leadData[0]?.status ? leadData[0]?.status : "N/A"}`}</span>
                                </li>
                                <li>
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        <Hotel className="icon" /> Preferred
                                        Rooms
                                        <button
                                            onClick={() => {
                                                setValue(
                                                    "roomsFrom",
                                                    leadData[0]?.roomsFrom || ""
                                                );
                                                setValue(
                                                    "roomsTo",
                                                    leadData[0]?.roomsTo || ""
                                                );
                                                setOpenRoomsModal(true);
                                            }}
                                            style={{
                                                border: "none",
                                                background: "transparent",
                                                cursor: "pointer",
                                                padding: "4px",
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <Edit size={16} />
                                        </button>
                                    </span>
                                    <span>{`${leadData[0]?.roomsFrom ? leadData[0]?.roomsFrom : "N/A"}-${leadData[0]?.roomsTo ? leadData[0]?.roomsTo : "N/A"}`}</span>
                                </li>
                                <li>
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        <Bath className="icon" /> Bath Rooms
                                        <button
                                            onClick={() => {
                                                setValue(
                                                    "from_bathroom",
                                                    leadData[0]
                                                        ?.from_bathroom || ""
                                                );
                                                setValue(
                                                    "to_bathroom",
                                                    leadData[0]?.to_bathroom ||
                                                    ""
                                                );
                                                setOpenBathroomModal(true);
                                            }}
                                            style={{
                                                border: "none",
                                                background: "transparent",
                                                cursor: "pointer",
                                                padding: "4px",
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <Edit size={16} />
                                        </button>
                                    </span>
                                    <span>{`${leadData[0]?.from_bathroom ? leadData[0]?.from_bathroom : "N/A"}-${leadData[0]?.to_bathroom ? leadData[0]?.to_bathroom : "N/A"}`}</span>
                                </li>

                                <li>
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        <Wallet className="icon" /> Budget
                                        <button
                                            onClick={() => {
                                                setValue(
                                                    "budgetFrom",
                                                    leadData[0]?.budgetFrom ||
                                                    ""
                                                );
                                                setValue(
                                                    "budgetTo",
                                                    leadData[0]?.budgetTo || ""
                                                );
                                                setOpenBudgetModal(true);
                                            }}
                                            style={{
                                                border: "none",
                                                background: "transparent",
                                                cursor: "pointer",
                                                padding: "4px",
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <Edit size={16} />
                                        </button>
                                    </span>
                                    <span>{`${leadData[0]?.budgetFrom ? leadData[0]?.budgetFrom : "N/A"}-${leadData[0]?.budgetTo ? leadData[0]?.budgetTo : "N/A"}`}</span>
                                </li>
                                <li>
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        <CheckSquare className="icon" /> Claim
                                    </span>
                                    <span>{`${leadData[0]?.isClaim ? leadData[0]?.isClaim : "N/A"}`}</span>
                                </li>

                                {leadData[0]?.locations?.length > 0 && (
                                    <>
                                        <li>
                                            <span
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                }}
                                            >
                                                <FileText className="icon" /> ID
                                            </span>
                                            <span>{`${leadData[0]?.locations ? leadData[0]?.locations[0]?.id : "N/A"}`}</span>
                                        </li>
                                        <li>
                                            <span
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                }}
                                            >
                                                <Building className="icon" />{" "}
                                                City
                                            </span>
                                            <span>{`${leadData[0]?.locations ? leadData[0]?.locations[0]?.city : "N/A"}`}</span>
                                        </li>
                                        <li>
                                            <span
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                }}
                                            >
                                                <Building2 className="icon" />{" "}
                                                Tower
                                            </span>
                                            <span>
                                                {leadData[0]?.locations?.[0]
                                                    ?.tower || "N/A"}
                                            </span>
                                        </li>
                                        <li>
                                            <span
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                }}
                                            >
                                                <LandPlot className="icon" />{" "}
                                                Community
                                            </span>
                                            <span>
                                                {leadData[0]?.locations?.[0]
                                                    ?.community || "N/A"}
                                            </span>
                                        </li>
                                        <li>
                                            <span
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                }}
                                            >
                                                <LandPlot className="icon" />{" "}
                                                Sub Community
                                            </span>
                                            <span>
                                                {leadData[0]?.locations?.[0]
                                                    ?.sub_community || "N/A"}
                                            </span>
                                        </li>
                                    </>
                                )}

                                <li>
                                    <Modal>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                }}
                                            >
                                                <Users className="icon" /> Agent
                                            </span>
                                            {hasPermission("assign_leads") && (
                                                <Modal.Open openWindowName="chooseAgent">
                                                    <button
                                                        className={
                                                            styles.btnChooseAgent
                                                        }
                                                        disabled={
                                                            isLoadingStaff
                                                        }
                                                        style={{
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",
                                                            border: "none",
                                                            background:
                                                                "transparent",
                                                            cursor: "pointer",
                                                            borderRadius: "50%",
                                                            width: "32px",
                                                            height: "32px",
                                                            boxShadow:
                                                                "0 1px 4px rgba(0,0,0,0.08)",
                                                        }}
                                                    >
                                                        <ChevronDown />
                                                    </button>
                                                </Modal.Open>
                                            )}
                                        </div>
                                        <span>
                                            {leadData[0]?.agent?.name || "N/A"}
                                        </span>

                                        <Modal.Window name="chooseAgent">
                                            <AgentChangeModal
                                                staffData={staffData}
                                                onChangeAgent={
                                                    handleChangeAgent
                                                }
                                                isChangingAgent={isUpdatingLead}
                                            />
                                        </Modal.Window>
                                    </Modal>
                                </li>

                                {leadData[0]?.bayut_lead_id && (
                                    <li>
                                        <span
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                            }}
                                        >
                                            <FileText className="icon" /> Bayut
                                            Lead ID
                                        </span>
                                        <span>{leadData[0].bayut_lead_id}</span>
                                    </li>
                                )}

                                {leadData[0]?.createTime && (
                                    <li>
                                        <span
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                            }}
                                        >
                                            <CalendarDays className="icon" />{" "}
                                            Created At
                                        </span>
                                        <span>
                                            {moment(
                                                leadData[0].createTime
                                            ).format("MMMM DD,YYYY h:mm A")}
                                        </span>
                                    </li>
                                )}

                                {leadData[0]?.updateTime && (
                                    <li>
                                        <span
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                            }}
                                        >
                                            <CalendarClock className="icon" />{" "}
                                            Update At
                                        </span>
                                        <span>
                                            {moment(
                                                leadData[0].updateTime
                                            ).format("MMMM DD,YYYY h:mm A")}
                                        </span>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* Extra Fields Section */}
                    {leadData[0]?.custom_fields &&
                        Object.keys(leadData[0].custom_fields).length > 0 && (
                            <div
                                className={styles.leadContent}
                                style={{ marginTop: "20px" }}
                            >
                                <div
                                    className={styles.leadTop}
                                    style={{
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "8px 0",
                                    }}
                                    onClick={() =>
                                        setIsExtraFieldsExpanded(
                                            !isExtraFieldsExpanded
                                        )
                                    }
                                >
                                    <h3
                                        style={{
                                            margin: "0",
                                            fontSize: "18px",
                                            fontWeight: "600",
                                        }}
                                    >
                                        Extra Fields
                                    </h3>
                                    {isExtraFieldsExpanded ? (
                                        <ChevronDown
                                            size={20}
                                            style={{ color: "#666" }}
                                        />
                                    ) : (
                                        <ChevronRight
                                            size={20}
                                            style={{ color: "#666" }}
                                        />
                                    )}
                                </div>
                                {isExtraFieldsExpanded && (
                                    <div
                                        style={{
                                            backgroundColor: "#f8f9fa",
                                            border: "1px solid #e9ecef",
                                            borderRadius: "8px",
                                            padding: "16px",
                                            marginTop: "12px",
                                            fontFamily: "monospace",
                                            fontSize: "14px",
                                            lineHeight: "1.5",
                                            overflow: "auto",
                                            maxHeight: "400px",
                                            whiteSpace: "pre-wrap",
                                            wordBreak: "break-word",
                                        }}
                                    >
                                        {JSON.stringify(
                                            leadData[0].custom_fields,
                                            null,
                                            2
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                    <div className={styles.btnsLeadOperations}>
                        {leadData[0]?.isClaim === "NO" && (
                            <button
                                className="btnFormNormal"
                                onClick={handleClaim}
                                disabled={isUpdatingLead}
                                style={{
                                    backgroundColor: "#22c55e",
                                    color: "white",
                                    border: "1px solid #22c55e",
                                }}
                            >
                                Claim Lead
                            </button>
                        )}

                        <button
                            className="btnFormNormal"
                            onClick={handleDealLead}
                            disabled={isUpdatingLead}
                            style={{
                                backgroundColor: "#6a87c0",
                                color: "white",
                                border: "1px solid #6a87c0",
                            }}
                        >
                            Deal Lead
                        </button>
                        <AIPropertySuggestions leadId={leadData[0]?.id} />

                        {/* Status Change Dropdown */}
                        <select
                            className="btnFormNormal"
                            value={leadData[0]?.status || "ACTIVE"}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            disabled={isUpdatingLead}
                            style={{
                                padding: "8px 12px",
                                cursor: "pointer",
                                border: "1px solid #d1d5db",
                                backgroundColor: "white",
                                borderRadius: "6px",
                                fontWeight: "500",
                            }}
                        >
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="POOL">Pool</option>
                            <option value="DEAL">Closed Deal</option>
                        </select>

                        {leadData[0]?.status === "ACTIVE" && (
                            <button
                                className="btnFormNormal"
                                onClick={() => handleStatusChange("INACTIVE")}
                                disabled={isUpdatingLead}
                            >
                                Inactivate
                            </button>
                        )}

                        {leadData[0]?.status === "INACTIVE" && (
                            <button
                                className="btnFormNormal"
                                onClick={() => handleStatusChange("ACTIVE")}
                                disabled={isUpdatingLead}
                            >
                                Activate
                            </button>
                        )}
                        {leadData[0]?.is_public && (
                            <button
                                className="btnFormNormal"
                                onClick={() => handleChangePublic(false)}
                                disabled={isUpdatingLead}
                            >
                                Private
                            </button>
                        )}

                        {!leadData[0]?.is_public && (
                            <button
                                className="btnFormNormal"
                                onClick={() => handleChangePublic(true)}
                                disabled={isUpdatingLead}
                            >
                                Public
                            </button>
                        )}

                        <button
                            className="btnFormNormal"
                            onClick={() =>
                                navigate(`/leads/edit/${leadData[0]?.id}`)
                            }
                        >
                            Edit
                        </button>

                        <DeleteLead
                            style={{
                                backgroundColor: "#ff6060d8",
                                color: "white",
                            }}
                            data={leadData[0]}
                            className={`btnFormNormal `}
                        />

                        {/* Communication Buttons */}
                        <button
                            className="btnFormNormal"
                            onClick={() => {
                                const subject = `Property Inquiry - ${leadData[0]?.name}`;
                                const body = `Hi ${leadData[0]?.name},\n\nThank you for your interest in our property listings. I'm reaching out to discuss your property requirements and how I can assist you in finding the perfect property in Dubai.\n\nBest regards,\n${leadData[0]?.agent?.name || "Property Agent"}`;
                                window.open(
                                    `mailto:${leadData[0]?.phone}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                                );
                            }}
                            style={{
                                backgroundColor: "#4CAF50",
                                color: "white",
                                border: "1px solid #4CAF50",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <Mail size={16} />
                            Email
                        </button>

                        <button
                            className="btnFormNormal"
                            onClick={() => {
                                const agentName =
                                    leadData[0]?.agent?.name ||
                                    "Property Agent";
                                const propertyLink = `${window.location.origin}/share-new-property/${leadData?.[0]?.clientType?.toLowerCase()}/${leadData?.[0]?.preferred_property?.[0]}`;

                                // Determine if it's a rent or sale lead based on lead data
                                // You can adjust this logic based on how you identify rent vs sale leads
                                const isRentLead =
                                    leadData[0]?.clientType?.toLowerCase() ===
                                    "rent";

                                let selectedMessage;

                                if (isRentLead) {
                                    // Rent template
                                    selectedMessage = `This is ${agentName} from ${companyName} . 👋\n\nThanks for your interest in this property — here's the listing link for your reference: ${leadData[0]?.preferred_property?.length > 0 ? propertyLink : "-"}\n\nIf you could share your move-in date, budget, and preferred area or community, I can send you a few options that fit your requirements right away.\n\nLooking forward to helping you find your next home! 🏡`;
                                } else {
                                    // Sale template (default)
                                    selectedMessage = `This is ${agentName} from ${companyName} . 👋\n\nThank you for your interest in the property you viewed — here's the listing link for your reference: ${leadData[0]?.preferred_property?.length > 0 ? propertyLink : "-"}\n\nAre you currently looking to buy for investment or personal use?\n\nOnce I know your budget and preferred areas , I can share a few great options that match your goals.\n\nLooking forward to helping you find the right property in Dubai. 🏡`;
                                }

                                const whatsappUrl = `https://wa.me/${leadData[0]?.phone?.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(selectedMessage)}`;
                                window.open(whatsappUrl, "_blank");
                            }}
                            style={{
                                backgroundColor: "#25D366",
                                color: "white",
                                border: "1px solid #25D366",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <MessageSquare size={16} />
                            WhatsApp
                        </button>

                        <button
                            className="btnFormNormal"
                            onClick={() => {
                                window.open(
                                    `tel:${leadData[0]?.phone}`,
                                    "_self"
                                );
                            }}
                            style={{
                                backgroundColor: "#2196F3",
                                color: "white",
                                border: "1px solid #2196F3",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <PhoneCall size={16} />
                            Call
                        </button>
                    </div>
                </div>

                <div className={styles.gridContainer}>
                    <div className={styles.followUps}>
                        <FollowUps
                            type="lead"
                            targetId={leadData[0]?.id}
                            maxWidth="100%"
                            isForProperty={false}
                            maxHeight={"35rem"}
                            height={"35rem"}
                        />
                    </div>
                    <div
                        className={`${styles.propertyReference} sectionDiv`}
                        style={{ height: "auto", maxHeight: "45rem" }}
                    >
                        <PropertyReference propertyId={leadData[0]?.id} />
                    </div>
                    <div className={styles.followUps}>
                        <PreferredProperty
                            preferred_property_details={
                                leadData[0]?.preferred_property_details
                            }
                            type={leadData[0]?.clientType}
                        />
                    </div>
                    <div className={styles.followUps}>
                        <PreferredDeveloper
                            preferred_developer_details={
                                leadData[0]?.preferred_developer_details
                            }
                        />
                    </div>
                    <div className={styles.followUps}>
                        <PreferredProject
                            preferred_project_details={
                                leadData[0]?.preferred_project_details
                            }
                        />
                    </div>
                    <div className={styles.followUps}>
                        {leadData[0]?.leads_message && (
                            <LeadMessage
                                message={leadData[0]?.leads_message}
                                agentName={leadData[0]?.agent?.name}
                                phoneNumber={leadData[0]?.phone}
                            />
                        )}
                    </div>
                    <div className={styles.leadLogs}>
                        <Logs
                            leadLogs={leadLogs}
                            isLoading={isLoadingLead}
                            isError={leadLogsError}
                            height={"35rem"}
                            maxHeight={"35rem"}
                        />
                    </div>
                    <div className={styles.notes}>
                        <Notes
                            type="lead"
                            targetId={leadData[0]?.id}
                            maxWidth="100%"
                            data={leadData[0]}
                        />
                    </div>
                </div>
            </section>

            {openLocationModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>Edit Location</h2>
                            <button
                                className={styles.closeButton}
                                onClick={() => setOpenLocationModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <FormInputAsyncDataList
                                    control={control}
                                    registerName="location"
                                    placeholder="Search location..."
                                    label="Location"
                                    asyncFunc={getLocations}
                                    formatFunc={formatLocationsForMetaAds}
                                    className="location-input"
                                />
                                <div className={styles.modalFooter}>
                                    <button
                                        type="button"
                                        className={styles.cancelButton}
                                        onClick={() =>
                                            setOpenLocationModal(false)
                                        }
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className={styles.saveButton}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {openPhoneModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>Edit Phone Number</h2>
                            <button
                                className={styles.closeButton}
                                onClick={() => setOpenPhoneModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <form
                                onSubmit={handleSubmit((data) => {
                                    if (!data.phone) return;
                                    changeLead({
                                        id: leadData[0]?.id,
                                        payload: {
                                            ...leadData[0],
                                            phone: data.phone,
                                        },
                                    });
                                    setOpenPhoneModal(false);
                                })}
                            >
                                <div className={styles.formGroup}>
                                    <label>Phone Number</label>
                                    <input
                                        {...register("phone")}
                                        type="tel"
                                        placeholder="Enter phone number"
                                    />
                                </div>
                                <div className={styles.modalFooter}>
                                    <button
                                        type="button"
                                        className={styles.cancelButton}
                                        onClick={() => setOpenPhoneModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className={styles.saveButton}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {openSecondaryPhoneModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>Edit Secondary Phone Number</h2>
                            <button
                                className={styles.closeButton}
                                onClick={() =>
                                    setOpenSecondaryPhoneModal(false)
                                }
                            >
                                ×
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <form
                                onSubmit={handleSubmit((data) => {
                                    if (!data.secondaryPhone) return;
                                    changeLead({
                                        id: leadData[0]?.id,
                                        payload: {
                                            ...leadData[0],
                                            secondryPhone: data.secondaryPhone,
                                        },
                                    });
                                    setOpenSecondaryPhoneModal(false);
                                })}
                            >
                                <div className={styles.formGroup}>
                                    <label>Secondary Phone Number</label>
                                    <input
                                        {...register("secondaryPhone")}
                                        type="tel"
                                        placeholder="Enter secondary phone number"
                                    />
                                </div>
                                <div className={styles.modalFooter}>
                                    <button
                                        type="button"
                                        className={styles.cancelButton}
                                        onClick={() =>
                                            setOpenSecondaryPhoneModal(false)
                                        }
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className={styles.saveButton}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {openEmailModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>Edit Email Address</h2>
                            <button
                                className={styles.closeButton}
                                onClick={() => setOpenEmailModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <form
                                onSubmit={handleSubmit((data) => {
                                    if (!data.email) return;
                                    changeLead({
                                        id: leadData[0]?.id,
                                        payload: {
                                            ...leadData[0],
                                            email: data.email,
                                        },
                                    });
                                    setOpenEmailModal(false);
                                })}
                            >
                                <div className={styles.formGroup}>
                                    <label>Email Address</label>
                                    <input
                                        {...register("email", {
                                            required: "Email is required",
                                            pattern: {
                                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                message:
                                                    "Invalid email address",
                                            },
                                        })}
                                        type="email"
                                        placeholder="Enter email address"
                                    />
                                    {errors.email && (
                                        <span className={styles.errorMessage}>
                                            {errors.email.message}
                                        </span>
                                    )}
                                </div>
                                <div className={styles.modalFooter}>
                                    <button
                                        type="button"
                                        className={styles.cancelButton}
                                        onClick={() => setOpenEmailModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className={styles.saveButton}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {openNationalityModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>Edit Nationality</h2>
                            <button
                                className={styles.closeButton}
                                onClick={() => setOpenNationalityModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <form
                                onSubmit={handleSubmit((data) => {
                                    if (!data.nationality) return;
                                    changeLead({
                                        id: leadData[0]?.id,
                                        payload: {
                                            ...leadData[0],
                                            nationality: data.nationality.value,
                                        },
                                    });
                                    setOpenNationalityModal(false);
                                })}
                            >
                                <div className={styles.formGroup}>
                                    <label>Nationality</label>
                                    <FormInputCountries
                                        control={control}
                                        registerName="nationality"
                                        placeholder="Select nationality"
                                        isMulti={false}
                                        required={true}
                                    />
                                    {errors.nationality && (
                                        <span className={styles.errorMessage}>
                                            {errors.nationality.message}
                                        </span>
                                    )}
                                </div>
                                <div className={styles.modalFooter}>
                                    <button
                                        type="button"
                                        className={styles.cancelButton}
                                        onClick={() =>
                                            setOpenNationalityModal(false)
                                        }
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className={styles.saveButton}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {openPropertyTypeModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>Edit Property Types</h2>
                            <button
                                className={styles.closeButton}
                                onClick={() => setOpenPropertyTypeModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <form
                                onSubmit={handleSubmit((data) => {
                                    if (!data.propertyType?.length) return;
                                    changeLead({
                                        id: leadData[0]?.id,
                                        payload: {
                                            ...leadData[0],
                                            property_type:
                                                data.propertyType.map(
                                                    (type) => type.value
                                                ),
                                        },
                                    });
                                    setOpenPropertyTypeModal(false);
                                })}
                            >
                                <div className={styles.formGroup}>
                                    <label>Property Types</label>
                                    <FormInputDataList
                                        control={control}
                                        registerName="propertyType"
                                        data={PROPERTY_TYPES}
                                        placeholder="Select property types"
                                        isMulti={true}
                                        required={true}
                                    />
                                    {errors.propertyType && (
                                        <span className={styles.errorMessage}>
                                            {errors.propertyType.message}
                                        </span>
                                    )}
                                </div>
                                <div className={styles.modalFooter}>
                                    <button
                                        type="button"
                                        className={styles.cancelButton}
                                        onClick={() =>
                                            setOpenPropertyTypeModal(false)
                                        }
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className={styles.saveButton}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {openRoomsModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>Edit Preferred Rooms</h2>
                            <button
                                className={styles.closeButton}
                                onClick={() => setOpenRoomsModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <form
                                onSubmit={handleSubmit((data) => {
                                    changeLead({
                                        id: leadData[0]?.id,
                                        payload: {
                                            ...leadData[0],
                                            roomsFrom: data.roomsFrom,
                                            roomsTo: data.roomsTo,
                                        },
                                    });
                                    setOpenRoomsModal(false);
                                })}
                            >
                                <div
                                    className={styles.formGroup}
                                    style={{ display: "flex", gap: "1rem" }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <label>From</label>
                                        <FormInputSelect
                                            register={register}
                                            registerName="roomsFrom"
                                            options={BEDROOM_NUM_OPTIONS}
                                            required={true}
                                            valueAsNumber={true}
                                        />
                                        {errors.roomsFrom && (
                                            <span
                                                className={styles.errorMessage}
                                            >
                                                {errors.roomsFrom.message}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label>To</label>
                                        <FormInputSelect
                                            register={register}
                                            registerName="roomsTo"
                                            options={BEDROOM_NUM_OPTIONS}
                                            required={true}
                                            valueAsNumber={true}
                                        />
                                        {errors.roomsTo && (
                                            <span
                                                className={styles.errorMessage}
                                            >
                                                {errors.roomsTo.message}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.modalFooter}>
                                    <button
                                        type="button"
                                        className={styles.cancelButton}
                                        onClick={() => setOpenRoomsModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className={styles.saveButton}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {openBathroomModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>Edit Bathrooms</h2>
                            <button
                                className={styles.closeButton}
                                onClick={() => setOpenBathroomModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <form
                                onSubmit={handleSubmit((data) => {
                                    changeLead({
                                        id: leadData[0]?.id,
                                        payload: {
                                            ...leadData[0],
                                            from_bathroom: data.from_bathroom,
                                            to_bathroom: data.to_bathroom,
                                        },
                                    });
                                    setOpenBathroomModal(false);
                                })}
                            >
                                <div
                                    className={styles.formGroup}
                                    style={{ display: "flex", gap: "1rem" }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <label>From</label>
                                        <FormInputSelect
                                            register={register}
                                            registerName="from_bathroom"
                                            options={[
                                                { label: "To", value: "" },
                                                ...NUM_OPTIONS.slice(1),
                                            ]}
                                            required={true}
                                            valueAsNumber={true}
                                        />
                                        {errors.from_bathroom && (
                                            <span
                                                className={styles.errorMessage}
                                            >
                                                {errors.from_bathroom.message}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label>To</label>
                                        <FormInputSelect
                                            register={register}
                                            registerName="to_bathroom"
                                            options={[
                                                { label: "To", value: "" },
                                                ...NUM_OPTIONS.slice(1),
                                            ]}
                                            required={true}
                                            valueAsNumber={true}
                                        />
                                        {errors.to_bathroom && (
                                            <span
                                                className={styles.errorMessage}
                                            >
                                                {errors.to_bathroom.message}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.modalFooter}>
                                    <button
                                        type="button"
                                        className={styles.cancelButton}
                                        onClick={() =>
                                            setOpenBathroomModal(false)
                                        }
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className={styles.saveButton}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {openBudgetModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>Edit Budget</h2>
                            <button
                                className={styles.closeButton}
                                onClick={() => setOpenBudgetModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <form
                                onSubmit={handleSubmit((data) => {
                                    changeLead({
                                        id: leadData[0]?.id,
                                        payload: {
                                            ...leadData[0],
                                            budgetFrom: data.budgetFrom,
                                            budgetTo: data.budgetTo,
                                        },
                                    });
                                    setOpenBudgetModal(false);
                                })}
                            >
                                <div
                                    className={styles.formGroup}
                                    style={{ display: "flex", gap: "1rem" }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <label>From</label>
                                        <input
                                            {...register("budgetFrom")}
                                            type="number"
                                            placeholder="AED"
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label>To</label>
                                        <input
                                            {...register("budgetTo")}
                                            type="number"
                                            placeholder="AED"
                                        />
                                    </div>
                                </div>
                                <div className={styles.modalFooter}>
                                    <button
                                        type="button"
                                        className={styles.cancelButton}
                                        onClick={() =>
                                            setOpenBudgetModal(false)
                                        }
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className={styles.saveButton}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LeadDetails;
