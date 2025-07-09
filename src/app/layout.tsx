// import { ReactNode } from "react";
// import "./globals.css";
// import Header from "./components/Header";
// import Sidebar from "./components/Sidebar";

// type RootLayoutProps = {
//   children: ReactNode;
// };

// export default function RootLayout({ children }: RootLayoutProps) {
//   return (
//     <html lang="en">
//       <body>
//         <div className="flex h-screen overflow-hidden">
//           <Sidebar />
//           <div className="flex flex-col flex-1 overflow-auto">
//             <div className="max-w-7xl mx-auto w-full">
//               <Header />
//               <main>{children}</main>
//             </div>
//           </div>
//         </div>
//       </body>
//     </html>
//   );
// }

import { ReactNode } from "react";
import "./globals.css";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <Sidebar />
        <div className="pl-20 transition-all duration-300">
          <Header />
          <main className="p-4">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}

