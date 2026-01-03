import React from 'react';
import { Facebook, Instagram, Twitter, Linkedin, Phone, Mail, MapPin } from 'lucide-react';

const NewBusinessCard = ({ data, side = 'front' }) => {
  // Extract dynamic colors from themeColor
  const themeColor = data?.themeColor || '#1a3a5f';
  const accentColor = '#4ade80'; // Green accent for tagline
  
  // Helper to extract company name parts
  const getCompanyParts = (companyName) => {
    if (!companyName) return { main: 'ONEX', sub: 'PROPERTIES' };
    const parts = companyName.toUpperCase().split(' ');
    if (parts.length > 1) {
      return { main: parts[0], sub: parts.slice(1).join(' ') };
    }
    return { main: companyName.toUpperCase(), sub: 'PROPERTIES' };
  };

  const companyParts = getCompanyParts(data?.company_name);

  // Generate darker shade for patterns
  const getDarkerShade = (color) => {
    // Simple darkening - convert hex to RGB, reduce brightness
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 30);
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 30);
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 30);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const darkerShade = getDarkerShade(themeColor);

  if (side === 'back') {
    // Back side: Light grey/white gradient with name/designation left, contact info right
    return (
      <div
        style={{
          width: 580,
          height: 340,
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          borderRadius: 16,
          background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 50%, #f0f0f0 100%)',
          overflow: 'hidden',
          fontFamily: 'Georgia, "Times New Roman", serif',
          position: 'relative',
          border: '1px solid rgba(0,0,0,0.1)',
        }}
      >
        {/* Subtle geometric pattern in corners */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '150px',
          height: '150px',
          opacity: 0.1,
          background: `repeating-linear-gradient(
            45deg,
            ${themeColor},
            ${themeColor} 10px,
            transparent 10px,
            transparent 20px
          )`,
          transform: 'rotate(45deg)',
          transformOrigin: 'top right',
        }} />
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '150px',
          height: '150px',
          opacity: 0.1,
          background: `repeating-linear-gradient(
            -45deg,
            ${themeColor},
            ${themeColor} 10px,
            transparent 10px,
            transparent 20px
          )`,
          transform: 'rotate(-45deg)',
          transformOrigin: 'bottom left',
        }} />

        {/* Main content container */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          height: '100%',
          display: 'flex',
          padding: '40px',
          gap: '40px',
        }}>
          {/* Left side - Name and Designation (Centered) */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <div style={{
              fontSize: 32,
              fontWeight: 700,
              color: '#1a1a1a',
              fontFamily: 'Georgia, "Times New Roman", serif',
              letterSpacing: '0.5px',
              textAlign: 'center',
            }}>
              {data?.name || 'Name'}
            </div>
            <div style={{
              fontSize: 18,
              fontWeight: 400,
              color: '#4a4a4a',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              textAlign: 'left',
            }}>
              {data?.job_type || 'Designation'}
            </div>
          </div>

          {/* Right side - Contact Information (Bottom aligned, Icons on right) */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
            gap: '14px',
            paddingRight: '12px',
            position: 'relative',
          }}>
            {/* Phone */}
            {data?.phone && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexDirection: 'row-reverse',
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Phone size={18} color={themeColor} strokeWidth={2} />
                </div>
                <span style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#1a1a1a',
                  fontFamily: 'Inter, sans-serif',
                  textAlign: 'right',
                }}>
                  {data.phone}
                </span>
              </div>
            )}

            {/* Email */}
            {data?.email && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexDirection: 'row-reverse',
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Mail size={18} color={themeColor} strokeWidth={2} />
                </div>
                <span style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: '#1a1a1a',
                  fontFamily: 'Inter, sans-serif',
                  textAlign: 'right',
                }}>
                  {data.email}
                </span>
              </div>
            )}

            {/* Address - show default if not provided */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              flexDirection: 'row-reverse',
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                flexShrink: 0,
                paddingTop: '2px',
              }}>
                <MapPin size={18} color={themeColor} strokeWidth={2} />
              </div>
              <span style={{
                fontSize: 15,
                fontWeight: 500,
                color: '#1a1a1a',
                fontFamily: 'Inter, sans-serif',
                lineHeight: '1.4',
                textAlign: 'right',
              }}>
                {data?.address || 'Hotel Seven Seas, Al-Nahada-1, Dubai'}
              </span>
            </div>

            {/* Dark blue vertical bar on right edge (reduced height) */}
            <div style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: '5px',
              height: '50%',
              background: themeColor,
              zIndex: 1,
            }} />
          </div>
        </div>
      </div>
    );
  }

  // Front side: Dark blue background with geometric patterns, logo, tagline, social icons
  return (
    <div
      style={{
        width: 580,
        height: 340,
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        borderRadius: 16,
        background: `linear-gradient(135deg, ${themeColor} 0%, ${darkerShade} 100%)`,
        overflow: 'hidden',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        position: 'relative',
        border: '1px solid rgba(255,255,255,0.1)',
        
      }}
    >
      {/* Geometric pattern overlay - stylized arrows/chevrons */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.2,
        zIndex: 1,
        background: `
          repeating-linear-gradient(
            45deg,
            transparent,
            transparent 30px,
            ${darkerShade} 30px,
            ${darkerShade} 32px
          ),
          repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 30px,
            ${darkerShade} 30px,
            ${darkerShade} 32px
          )
        `,
      }} />

      {/* Main content - Slightly left aligned */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '40px 40px 40px 50px',
        textAlign: 'center',
      }}>
        {/* Company Logo/Name - ONEX */}
        <div style={{
          fontSize: 70,
          fontWeight: 900,
          color: '#ffffff',
          letterSpacing: '6px',
          fontFamily: 'Inter, sans-serif',
          textShadow: '0 4px 12px rgba(0,0,0,0.3)',
          position: 'relative',
          lineHeight: '1',
          textAlign: 'center',
        }}>
          {companyParts.main}
        </div>

        {/* PROPERTIES text */}
        <div style={{
          fontSize: 18,
          fontWeight: 600,
          color: '#ffffff',
          fontFamily: 'Inter, sans-serif',
          textTransform: 'uppercase',
          textAlign: 'center',
          marginLeft: '50px',
        }}>
          {companyParts.sub}
        </div>

        {/* Tagline - "Real Estate Reimagined" */}
        <div style={{
          fontSize: 18,
          fontFamily: 'Inter, sans-serif',
          marginBottom: '40px',
          fontStyle: 'italic',
          textAlign: 'center',
          marginLeft: '10px',
        }}>
          <span style={{ color: '#ffffff' }}>Real Estate </span>
          <span style={{ color: accentColor, fontWeight: 700 }}>Reimagined</span>
        </div>
      </div>

      {/* Bottom Right Section - Social Icons and Website */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        right: '30px',
        zIndex: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '12px',
      }}>
        {/* Social Media Icons */}
        <div style={{
          display: 'flex',
          gap: '10px',
        }}>
          {/* Facebook */}
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'transparent',
            border: '2px solid #ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            <Facebook size={18} color="#ffffff" strokeWidth={2} />
          </div>

          {/* Instagram */}
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'transparent',
            border: '2px solid #ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            <Instagram size={18} color="#ffffff" strokeWidth={2} />
          </div>

          {/* Twitter */}
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'transparent',
            border: '2px solid #ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            <Twitter size={18} color="#ffffff" strokeWidth={2} />
          </div>

          {/* LinkedIn */}
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'transparent',
            border: '2px solid #ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            <Linkedin size={18} color="#ffffff" strokeWidth={2} />
          </div>
        </div>

        {/* Website */}
        <div style={{
          fontSize: 14,
          fontWeight: 500,
          color: '#ffffff',
          letterSpacing: '1px',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'right',
        }}>
          {data?.website || 'www.onexproperty.com'}
        </div>
      </div>
    </div>
  );
};

export default NewBusinessCard;

