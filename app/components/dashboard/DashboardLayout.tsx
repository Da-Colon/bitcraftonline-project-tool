import { Box, Container } from "@chakra-ui/react"
import type { ReactNode } from "react"

interface DashboardLayoutProps {
  hero?: ReactNode
  children: ReactNode
}

export function DashboardLayout({ hero, children }: DashboardLayoutProps) {
  return (
    <Box
      position="relative"
      bgGradient="linear(to-b, #0f172a, #111827)"
      minH="calc(100vh - 72px)"
      color="gray.50"
      _before={{
        content: '""',
        position: "absolute",
        inset: 0,
        bg: "radial-gradient(circle at 20% 20%, rgba(96, 165, 250, 0.22), transparent 60%)",
        pointerEvents: "none",
      }}
    >
      <Box position="relative" overflow="hidden" zIndex={1}>
        <Box
          _after={{
            content: '""',
            position: "absolute",
            inset: 0,
          bgGradient: "linear(to-b, rgba(15,23,42,0.25), rgba(15,23,42,0.6))",
          }}
          bgImage="url('/assets/Randy UI/screenshot.png')"
          bgPosition="center"
          bgRepeat="no-repeat"
          bgSize="cover"
          minH="320px"
          borderBottomRadius={{ base: "4xl", md: "5xl" }}
        >
          <Box position="relative" zIndex={1}>
            {hero}
          </Box>
        </Box>
      </Box>

      <Container maxW="container.xl" mt={{ base: "-1rem", md: "-2rem" }} pb={12} position="relative" zIndex={1}>
        <Box
          bg="rgba(17, 24, 39, 0.85)"
          backdropFilter="blur(14px)"
          borderRadius={{ base: "2xl", md: "3xl" }}
          border="1px solid rgba(148, 163, 184, 0.35)"
          px={{ base: 6, md: 10 }}
          py={{ base: 8, md: 10 }}
          boxShadow="xl"
        >
          {children}
        </Box>
      </Container>
    </Box>
  )
}
