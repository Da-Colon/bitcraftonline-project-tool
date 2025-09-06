import { extendTheme, ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

// Semantic color tokens for BitCraft theme with improved contrast
const colors = {
  brand: {
    primary: "#4299E1", // blue.400 - better contrast
    secondary: "#9F7AEA", // purple.400
    accent: "#4FD1C7", // teal.400
    primaryHover: "#3182CE", // blue.500
    secondaryHover: "#805AD5", // purple.500
  },
  tier: {
    0: "#F6AD55", // orange.400 - Raw materials
    1: "#63B3ED", // blue.400 - Basic crafted
    2: "#B794F6", // purple.400 - Advanced crafted
    3: "#F6E05E", // yellow.400 - Rare
    4: "#FC8181", // red.400 - Epic
    5: "#68D391", // green.400 - Legendary
  },
  surface: {
    primary: "#2D3748", // gray.700 - lighter for better contrast
    secondary: "#4A5568", // gray.600
    tertiary: "#718096", // gray.500
    background: "#1A202C", // gray.800 - lighter background
    elevated: "#374151", // custom elevated surface
  },
  border: {
    primary: "rgba(255, 255, 255, 0.24)", // whiteAlpha.300 - more visible
    secondary: "rgba(255, 255, 255, 0.36)", // whiteAlpha.400
    accent: "rgba(255, 255, 255, 0.48)", // whiteAlpha.500
    focus: "#4299E1", // brand.primary for focus states
  },
  text: {
    primary: "#FFFFFF", // pure white for max contrast
    secondary: "#F7FAFC", // gray.50
    muted: "#CBD5E0", // gray.300 - more readable
    inverse: "#1A202C", // gray.800
    onBrand: "#FFFFFF", // white text on brand colors
  },
  status: {
    success: "#48BB78", // green.400
    warning: "#ED8936", // orange.500
    error: "#F56565", // red.400
    info: "#4299E1", // blue.400
  },
};

const theme = extendTheme({
  config,
  colors,
  styles: {
    global: {
      body: {
        bg: "surface.background",
        color: "text.primary",
      },
    },
  },
  components: {
    Container: {
      baseStyle: {
        px: { base: 4, md: 6 },
      },
    },
    Box: {
      variants: {
        card: {
          bg: "surface.primary",
          borderRadius: "lg",
          border: "1px solid",
          borderColor: "border.primary",
          p: 4,
        },
        cardSecondary: {
          bg: "surface.secondary",
          borderRadius: "lg",
          border: "1px solid",
          borderColor: "border.primary",
          p: 4,
        },
        surface: {
          bg: "surface.primary",
          borderRadius: "md",
          border: "1px solid",
          borderColor: "border.primary",
        },
      },
    },
    Button: {
      baseStyle: {
        fontWeight: "semibold",
        borderRadius: "md",
        _focus: {
          boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.6)",
        },
      },
      variants: {
        primary: {
          bg: "brand.primary",
          color: "text.onBrand",
          border: "1px solid",
          borderColor: "brand.primary",
          _hover: {
            bg: "brand.primaryHover",
            borderColor: "brand.primaryHover",
            _disabled: {
              bg: "surface.tertiary",
              borderColor: "surface.tertiary",
              color: "text.muted",
            },
          },
          _disabled: {
            bg: "surface.tertiary",
            borderColor: "surface.tertiary",
            color: "text.muted",
            cursor: "not-allowed",
          },
        },
        secondary: {
          bg: "surface.elevated",
          color: "text.primary",
          border: "1px solid",
          borderColor: "border.secondary",
          _hover: {
            bg: "surface.secondary",
            borderColor: "border.accent",
          },
        },
        outline: {
          bg: "transparent",
          color: "text.primary",
          border: "1px solid",
          borderColor: "border.secondary",
          _hover: {
            bg: "surface.elevated",
            borderColor: "border.accent",
          },
        },
        ghost: {
          bg: "transparent",
          color: "text.primary",
          _hover: {
            bg: "surface.elevated",
          },
        },
      },
      defaultProps: {
        variant: "primary",
      },
    },
    Input: {
      variants: {
        filled: {
          field: {
            bg: "surface.background",
            borderColor: "border.secondary",
            _hover: {
              borderColor: "border.accent",
            },
            _focus: {
              borderColor: "border.focus",
              boxShadow: "0 0 0 1px var(--chakra-colors-border-focus)",
            },
          },
        },
      },
      defaultProps: {
        variant: "filled",
      },
    },
    Menu: {
      baseStyle: {
        list: {
          bg: "surface.elevated",
          borderColor: "border.secondary",
          border: "1px solid",
          borderRadius: "md",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)",
          py: 2,
        },
        item: {
          bg: "transparent",
          color: "text.primary",
          _hover: {
            bg: "surface.secondary",
            color: "text.primary",
          },
          _focus: {
            bg: "surface.secondary",
            color: "text.primary",
          },
        },
      },
    },
    Tabs: {
      baseStyle: {
        tab: {
          color: "text.muted",
          _selected: {
            bg: "surface.elevated",
            color: "text.primary",
            borderColor: "brand.primary",
            borderBottomColor: "surface.elevated",
          },
          _hover: {
            bg: "surface.elevated",
            color: "text.primary",
          },
        },
        tablist: {
          bg: "surface.primary",
          p: 2,
          borderRadius: "md",
          border: "1px solid",
          borderColor: "border.primary",
        },
        tabpanel: {
          p: 4,
        },
      },
    },
    Table: {
      variants: {
        bitcraft: {
          th: {
            borderColor: "border.primary",
            color: "text.primary",
            fontWeight: "bold",
            bg: "surface.elevated",
          },
          td: {
            borderColor: "border.primary",
            color: "text.primary",
          },
          tbody: {
            tr: {
              _hover: {
                bg: "surface.elevated",
              },
            },
          },
        },
      },
      defaultProps: {
        variant: "bitcraft",
      },
    },
    Badge: {
      baseStyle: {
        fontWeight: "semibold",
        fontSize: "xs",
        px: 2,
        py: 1,
        borderRadius: "md",
      },
      variants: {
        tier: (props: any) => {
          const tier = props.tier || 0;
          const tierColors = {
            0: "orange",
            1: "blue", 
            2: "purple",
            3: "yellow",
            4: "red",
            5: "green",
          };
          return {
            colorScheme: tierColors[tier as keyof typeof tierColors] || "gray",
          };
        },
        status: {
          bg: "surface.elevated",
          color: "text.primary",
          borderRadius: "md",
          border: "1px solid",
          borderColor: "border.primary",
        },
      },
    },
    Avatar: {
      baseStyle: {
        bg: "surface.elevated",
        color: "text.primary",
        border: "1px solid",
        borderColor: "border.primary",
      },
    },
  },
});

// Helper function to get tier color scheme
export const getTierColorScheme = (tier: number): string => {
  const tierColors = {
    0: "orange", // Raw materials
    1: "blue",   // Basic crafted
    2: "purple", // Advanced crafted
    3: "yellow", // Rare
    4: "red",    // Epic
    5: "teal",   // Legendary
  };
  return tierColors[tier as keyof typeof tierColors] || "gray";
};

export default theme;

