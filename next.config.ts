import type { NextConfig } from "next";

let nextConfig: NextConfig = {
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'recharts',
      'date-fns',
    ],
  },
  async redirects() {
    return [
      // Inventory
      { source: '/inventory', destination: '/inventario', permanent: true },
      { source: '/inventory/:path*', destination: '/inventario/:path*', permanent: true },

      // Email
      { source: '/email', destination: '/correo', permanent: true },
      { source: '/email/:path*', destination: '/correo/:path*', permanent: true },

      // Debts
      { source: '/debts', destination: '/deudas', permanent: true },

      // Payroll (specific routes first, then dynamic, then catch-all)
      { source: '/payroll/mi', destination: '/nomina/mi', permanent: true },
      { source: '/payroll/new', destination: '/nomina/crear', permanent: true },
      { source: '/payroll/history', destination: '/nomina/historial', permanent: true },
      { source: '/payroll/settings', destination: '/nomina/configuracion', permanent: true },
      { source: '/payroll/period/:periodId', destination: '/nomina/periodo/:periodId', permanent: true },
      // ⚠️ Must stay after all static payroll routes to avoid capturing "mi", "new", etc.
      { source: '/payroll/:employeeId', destination: '/nomina/empleado/:employeeId', permanent: true },
      { source: '/payroll', destination: '/nomina', permanent: true },

      // Settings
      { source: '/settings/data-retention', destination: '/ajustes/retencion-datos', permanent: true },
      { source: '/settings/:path*', destination: '/ajustes/:path*', permanent: true },
      { source: '/settings', destination: '/ajustes', permanent: true },

      // Billing
      { source: '/billing/:path*', destination: '/facturacion/:path*', permanent: true },
      { source: '/billing', destination: '/facturacion', permanent: true },

      // Suspended
      { source: '/suspended', destination: '/suspendido', permanent: true },

      // Notificaciones sub-routes
      { source: '/notificaciones/messages/:path*', destination: '/notificaciones/mensajes/:path*', permanent: true },
      { source: '/notificaciones/messages', destination: '/notificaciones/mensajes', permanent: true },
      { source: '/notificaciones/dead-letter', destination: '/notificaciones/rechazados', permanent: true },

      // Public
      { source: '/invite/:path*', destination: '/invitar/:path*', permanent: true },
      { source: '/invite', destination: '/invitar', permanent: true },
      { source: '/help/special-days', destination: '/ayuda/dias-especiales', permanent: true },
    ]
  },
};

if (process.env.ANALYZE === 'true') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: true,
  })
  nextConfig = withBundleAnalyzer(nextConfig)
}

export default nextConfig;
