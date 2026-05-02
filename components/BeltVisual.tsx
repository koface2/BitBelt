/**
 * BeltVisual — Sleek React Native belt illustration.
 *
 * Three sizes:
 *   sm  22 px — compact chip / badge
 *   md  44 px — timeline card, hover popup
 *   lg  68 px — profile header, featured display
 *
 * Design: horizontal belt strip with a darker "rank bar" on the right,
 * top highlight stripe, bottom shadow stripe.  lg adds the belt name
 * centred in the body.
 */

import React from "react";
import { View, Text } from "react-native";

// ── Belt colour specifications ────────────────────────────────────────────────

interface BeltSpec {
  body:        string;   // main belt colour
  highlight:   string;   // top-edge lighter stripe
  shadow:      string;   // bottom-edge darker stripe
  rankBar:     string;   // rank-bar fill
  rankAccent:  string;   // rank-bar top highlight
  text:        string;   // label / centre text colour
}

const SPECS: Record<string, BeltSpec> = {
  White: {
    body:       "#E4E4E7",
    highlight:  "#FFFFFF",
    shadow:     "#A1A1AA",
    rankBar:    "#18181B",
    rankAccent: "#3F3F46",
    text:       "#374151",
  },
  Blue: {
    body:       "#1D4ED8",
    highlight:  "#3B82F6",
    shadow:     "#1E3A8A",
    rankBar:    "#0F172A",
    rankAccent: "#1E40AF",
    text:       "#EFF6FF",
  },
  Purple: {
    body:       "#7C3AED",
    highlight:  "#A78BFA",
    shadow:     "#4C1D95",
    rankBar:    "#1E1B4B",
    rankAccent: "#3730A3",
    text:       "#F5F3FF",
  },
  Brown: {
    body:       "#92400E",
    highlight:  "#B45309",
    shadow:     "#451A03",
    rankBar:    "#1C0A00",
    rankAccent: "#3D1A07",
    text:       "#FEF3C7",
  },
  Black: {
    body:       "#111827",
    highlight:  "#374151",
    shadow:     "#000000",
    rankBar:    "#7F1D1D",
    rankAccent: "#991B1B",
    text:       "#F9FAFB",
  },
};

// ── Size tokens ───────────────────────────────────────────────────────────────

const HEIGHT:     Record<string, number> = { sm: 22, md: 44, lg: 68 };
const RANK_W:     Record<string, number> = { sm: 0,  md: 38, lg: 58 };
const EDGE_H:     Record<string, number> = { sm: 0,  md: 2,  lg: 4  };
const TEXT_SIZE:  Record<string, number> = { sm: 9,  md: 10, lg: 12 };
const CORNER:     Record<string, number> = { sm: 3,  md: 5,  lg: 7  };

// ── Component ─────────────────────────────────────────────────────────────────

export type BeltSize = "sm" | "md" | "lg";

interface Props {
  color:      string;
  size?:      BeltSize;
  showLabel?: boolean;    // show belt-name label below the strip
  style?:     object;
}

export default function BeltVisual({
  color,
  size = "md",
  showLabel = false,
  style,
}: Props) {
  const spec     = SPECS[color] ?? SPECS.White;
  const h        = HEIGHT[size];
  const rw       = RANK_W[size];
  const eh       = EDGE_H[size];
  const ts       = TEXT_SIZE[size];
  const cr       = CORNER[size];
  const showRank = rw > 0;
  const showText = size === "lg";

  return (
    <View style={style}>
      {/* ── Belt strip ── */}
      <View
        style={{
          height: h,
          flexDirection: "row",
          borderRadius: cr,
          overflow: "hidden",
          // Subtle elevation for depth
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.18,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        {/* Belt body */}
        <View
          style={{
            flex: 1,
            backgroundColor: spec.body,
            justifyContent: "space-between",
          }}
        >
          {/* Top highlight stripe */}
          {eh > 0 && (
            <View style={{ height: eh, backgroundColor: spec.highlight }} />
          )}

          {/* Centre label (lg only) */}
          {showText && (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: spec.text,
                  fontSize: ts,
                  fontWeight: "800",
                  letterSpacing: 2.5,
                  textTransform: "uppercase",
                  opacity: 0.88,
                }}
              >
                {color.toUpperCase()} BELT
              </Text>
            </View>
          )}

          {/* Bottom shadow stripe */}
          {eh > 0 && (
            <View style={{ height: eh + 1, backgroundColor: spec.shadow }} />
          )}
        </View>

        {/* Rank bar */}
        {showRank && (
          <View
            style={{
              width: rw,
              backgroundColor: spec.rankBar,
              justifyContent: "space-between",
            }}
          >
            {eh > 0 && (
              <View style={{ height: eh, backgroundColor: spec.rankAccent }} />
            )}
            {/* Centre divider line inside rank bar */}
            {size === "lg" && (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    width: 1,
                    height: "60%",
                    backgroundColor: spec.rankAccent,
                    opacity: 0.6,
                  }}
                />
              </View>
            )}
            {eh > 0 && (
              <View
                style={{ height: eh + 1, backgroundColor: spec.shadow }}
              />
            )}
          </View>
        )}
      </View>

      {/* ── Optional label below ── */}
      {showLabel && (
        <Text
          style={{
            marginTop: 6,
            textAlign: "center",
            fontSize: 11,
            fontWeight: "700",
            color: spec.body,
            letterSpacing: 1.2,
            textTransform: "uppercase",
          }}
        >
          {color} Belt
        </Text>
      )}
    </View>
  );
}
