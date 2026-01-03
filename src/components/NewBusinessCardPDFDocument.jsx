import {
    Document,
    Page,
    Text,
    View,
    Image,
    StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
    page: {
        flexDirection: "column",
        backgroundColor: "#ffffff",
        padding: 40,
        fontFamily: "Helvetica",
        justifyContent: "center",
        alignItems: "center",
    },
    cardContainer: {
        flexDirection: "column",
        alignItems: "center",
        gap: 40,
        justifyContent: "center",
        flex: 1,
    },
    cardWrapper: {
        width: "85.6mm",
        height: "53.98mm",
        border: "1px solid #e5e7eb",
        borderRadius: 6,
        overflow: "hidden",
        backgroundColor: "#ffffff",
    },
    cardImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },
    cardLabel: {
        fontSize: 12,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 8,
        color: "#2d4263",
        fontFamily: "Helvetica",
    },
});

const NewBusinessCardPDFDocument = ({ data }) => {
    const themeColor = data?.themeColor || "#1a3a5f";
    const accentColor = "#4ade80";

    // Helper to extract company name parts
    const getCompanyParts = (companyName) => {
        if (!companyName) return { main: "ONEX", sub: "PROPERTIES" };
        const parts = companyName.toUpperCase().split(" ");
        if (parts.length > 1) {
            return { main: parts[0], sub: parts.slice(1).join(" ") };
        }
        return { main: companyName.toUpperCase(), sub: "PROPERTIES" };
    };

    const companyParts = getCompanyParts(data?.company_name);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.cardContainer}>
                    {/* Front Card */}
                    <View>
                        <View style={styles.cardWrapper}>
                            {data.frontImg ? (
                                <Image src={data.frontImg} style={styles.cardImage} />
                            ) : (
                                <View
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        backgroundColor: themeColor,
                                        padding: 15,
                                        position: "relative",
                                    }}
                                >
                                    {/* Center Content */}
                                    <View
                                        style={{
                                            flex: 1,
                                            justifyContent: "center",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 32,
                                                fontWeight: "bold",
                                                color: "#ffffff",
                                                letterSpacing: 2,
                                                textAlign: "center",
                                            }}
                                        >
                                            {companyParts.main}
                                        </Text>
                                        <Text
                                            style={{
                                                fontSize: 9,
                                                fontWeight: "bold",
                                                color: "#ffffff",
                                                letterSpacing: 1,
                                                textAlign: "center",
                                                marginTop: 2,
                                            }}
                                        >
                                            {companyParts.sub}
                                        </Text>
                                        <Text
                                            style={{
                                                fontSize: 10,
                                                color: accentColor,
                                                fontStyle: "italic",
                                                textAlign: "center",
                                                marginTop: 8,
                                            }}
                                        >
                                            Real Estate Reimagined
                                        </Text>
                                    </View>

                                    {/* Bottom Right - Social Icons and Website */}
                                    <View
                                        style={{
                                            position: "absolute",
                                            bottom: 12,
                                            right: 12,
                                            alignItems: "flex-end",
                                            gap: 6,
                                        }}
                                    >
                                        {/* Social Icons Row */}
                                        <View
                                            style={{
                                                flexDirection: "row",
                                                gap: 5,
                                            }}
                                        >
                                            <View
                                                style={{
                                                    width: 18,
                                                    height: 18,
                                                    borderRadius: 9,
                                                    border: "1px solid #ffffff",
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <Text style={{ fontSize: 8, color: "#ffffff" }}>f</Text>
                                            </View>
                                            <View
                                                style={{
                                                    width: 18,
                                                    height: 18,
                                                    borderRadius: 9,
                                                    border: "1px solid #ffffff",
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <Text style={{ fontSize: 8, color: "#ffffff" }}>IG</Text>
                                            </View>
                                            <View
                                                style={{
                                                    width: 18,
                                                    height: 18,
                                                    borderRadius: 9,
                                                    border: "1px solid #ffffff",
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <Text style={{ fontSize: 8, color: "#ffffff" }}>T</Text>
                                            </View>
                                            <View
                                                style={{
                                                    width: 18,
                                                    height: 18,
                                                    borderRadius: 9,
                                                    border: "1px solid #ffffff",
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <Text style={{ fontSize: 8, color: "#ffffff" }}>in</Text>
                                            </View>
                                        </View>
                                        {/* Website */}
                                        <Text
                                            style={{
                                                fontSize: 7,
                                                color: "#ffffff",
                                                letterSpacing: 0.5,
                                                textAlign: "right",
                                            }}
                                        >
                                            {data?.website || "www.onexproperty.com"}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Back Card */}
                    <View>
                        <View style={styles.cardWrapper}>
                            {data.backImg ? (
                                <Image src={data.backImg} style={styles.cardImage} />
                            ) : (
                                <View
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        backgroundColor: "#f5f5f5",
                                        padding: 15,
                                        flexDirection: "row",
                                        position: "relative",
                                    }}
                                >
                                    {/* Left side - Name and Designation (Centered) */}
                                    <View
                                        style={{
                                            flex: 1,
                                            justifyContent: "center",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 16,
                                                fontWeight: "bold",
                                                color: "#1a1a1a",
                                                fontFamily: "Times-Roman",
                                                textAlign: "center",
                                            }}
                                        >
                                            {data?.name || "Name"}
                                        </Text>
                                        <Text
                                            style={{
                                                fontSize: 9,
                                                color: "#4a4a4a",
                                                fontStyle: "italic",
                                                fontFamily: "Times-Roman",
                                                textAlign: "left",
                                                marginTop: 4,
                                            }}
                                        >
                                            {data?.job_type || "Designation"}
                                        </Text>
                                    </View>

                                    {/* Right side - Contact Info (Bottom aligned, Icons on right) */}
                                    <View
                                        style={{
                                            flex: 1,
                                            justifyContent: "flex-end",
                                            alignItems: "flex-end",
                                            paddingRight: 6,
                                            position: "relative",
                                            gap: 7,
                                        }}
                                    >
                                        {data?.phone && (
                                            <View
                                                style={{
                                                    flexDirection: "row-reverse",
                                                    alignItems: "center",
                                                    gap: 5,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 7,
                                                        color: themeColor,
                                                    }}
                                                >
                                                    📞
                                                </Text>
                                                <Text
                                                    style={{
                                                        fontSize: 8,
                                                        fontWeight: "bold",
                                                        color: "#1a1a1a",
                                                        textAlign: "right",
                                                    }}
                                                >
                                                    {data.phone}
                                                </Text>
                                            </View>
                                        )}
                                        {data?.email && (
                                            <View
                                                style={{
                                                    flexDirection: "row-reverse",
                                                    alignItems: "center",
                                                    gap: 5,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 7,
                                                        color: themeColor,
                                                    }}
                                                >
                                                    ✉️
                                                </Text>
                                                <Text
                                                    style={{
                                                        fontSize: 8,
                                                        color: "#1a1a1a",
                                                        textAlign: "right",
                                                    }}
                                                >
                                                    {data.email}
                                                </Text>
                                            </View>
                                        )}
                                        {data?.address && (
                                            <View
                                                style={{
                                                    flexDirection: "row-reverse",
                                                    alignItems: "flex-start",
                                                    gap: 5,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 7,
                                                        color: themeColor,
                                                        marginTop: 1,
                                                    }}
                                                >
                                                    📍
                                                </Text>
                                                <Text
                                                    style={{
                                                        fontSize: 8,
                                                        color: "#1a1a1a",
                                                        textAlign: "right",
                                                        lineHeight: 1.3,
                                                    }}
                                                >
                                                    {data.address}
                                                </Text>
                                            </View>
                                        )}

                                        {/* Vertical bar on right edge (50% height) */}
                                        <View
                                            style={{
                                                position: "absolute",
                                                right: 0,
                                                bottom: 0,
                                                width: 2.5,
                                                height: "50%",
                                                backgroundColor: themeColor,
                                            }}
                                        />
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

export default NewBusinessCardPDFDocument;

