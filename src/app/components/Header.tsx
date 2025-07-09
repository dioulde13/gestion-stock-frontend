// import React from "react";

// const Header = () => {
//     return <header className="bg [#1e1e1e] shadow lg border-b border [#1f1f1f] max-4 sm:mx-6 lg:mx-8 mt-4 mb-2 rounded lg">
//         <div className="max-w7xl mx-auto py-4 px-4 sm:px-6 flex items-center justify-between">
//             <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-100">
//                 Dashboard
//             </h1>
//             <div>Right</div>
//         </div>
//     </header>
// }

// export default Header;
import React from "react";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-[#1e1e1e] shadow border-b border-[#1f1f1f] z-40">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 flex items-center justify-between">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-100">
        </h1>
        <div>Right</div>
      </div>
    </header>
  );
};

export default Header;

