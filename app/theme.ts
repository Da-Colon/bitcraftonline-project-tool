import { extendTheme, ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  styles: {
    global: {
      body: {
        bg: "gray.900",
        color: "gray.100",
      },
    },
  },
  components: {
    Container: {
      baseStyle: {
        px: { base: 4, md: 6 },
      },
    },
    Tabs: {
      baseStyle: {
        tab: {
          _selected: {
            bg: "gray.700",
            color: "white",
          },
        },
      },
    },
  },
});

export default theme;

