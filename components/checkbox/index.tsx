// type Props = {
//   id?: string
//   className?: string
//   color?: string
// }

// const Checkbox = (props: Props) => {
//   const { id, className, color } = props;
//   return (
//     <input
//       id={id}
//       type="checkbox"
//       className={`defaultCheckbox relative flex h-[20px] min-h-[20px] w-[20px] min-w-[20px] appearance-none items-center 
//       justify-center rounded-md border border-gray-300 text-white/0 outline-none transition duration-[0.2s]
//       checked:border-none checked:text-white hover:cursor-pointer dark:border-white/10 ${color === "red"
//           ? "checked:border-none checked:bg-red-500 dark:checked:bg-red-400"
//           : color === "blue"
//             ? "checked:border-none checked:bg-blue-500 dark:checked:bg-blue-400"
//             : color === "green"
//               ? "checked:border-none checked:bg-green-500 dark:checked:bg-green-400"
//               : color === "yellow"
//                 ? "checked:border-none checked:bg-yellow-500 dark:checked:bg-yellow-400"
//                 : color === "orange"
//                   ? "checked:border-none checked:bg-orange-500 dark:checked:bg-orange-400"
//                   : color === "teal"
//                     ? "checked:border-none checked:bg-teal-500 dark:checked:bg-teal-400"
//                     : color === "navy"
//                       ? "checked:border-none checked:bg-navy-500 dark:checked:bg-navy-400"
//                       : color === "lime"
//                         ? "checked:border-none checked:bg-lime-500 dark:checked:bg-lime-400"
//                         : color === "cyan"
//                           ? "checked:border-none checked:bg-cyan-500 dark:checked:bg-cyan-400"
//                           : color === "pink"
//                             ? "checked:border-none checked:bg-pink-500 dark:checked:bg-pink-400"
//                             : color === "purple"
//                               ? "checked:border-none checked:bg-purple-500 dark:checked:bg-purple-400"
//                               : color === "amber"
//                                 ? "checked:border-none checked:bg-amber-500 dark:checked:bg-amber-400"
//                                 : color === "indigo"
//                                   ? "checked:border-none checked:bg-indigo-500 dark:checked:bg-indigo-400"
//                                   : color === "gray"
//                                     ? "checked:border-none checked:bg-gray-500 dark:checked:bg-gray-400"
//                                     : "checked:bg-brand-500 dark:checked:bg-brand-400"
//         } ${className}`}
//       name="weekly"
//     />
//   );
// };

// export default Checkbox;


type Props = {
  id?: string;
  className?: string;
  color?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void; // New prop for handling change events
};

const Checkbox = ({ id, className = "", color, checked = false, onChange }: Props) => {
  // Determine the color class based on the `color` prop
  const colorClass = (() => {
    switch (color) {
      case "red":
        return "checked:bg-red-500 dark:checked:bg-red-400";
      case "blue":
        return "checked:bg-blue-500 dark:checked:bg-blue-400";
      case "green":
        return "checked:bg-green-500 dark:checked:bg-green-400";
      case "yellow":
        return "checked:bg-yellow-500 dark:checked:bg-yellow-400";
      case "orange":
        return "checked:bg-orange-500 dark:checked:bg-orange-400";
      case "teal":
        return "checked:bg-teal-500 dark:checked:bg-teal-400";
      case "navy":
        return "checked:bg-navy-500 dark:checked:bg-navy-400";
      case "lime":
        return "checked:bg-lime-500 dark:checked:bg-lime-400";
      case "cyan":
        return "checked:bg-cyan-500 dark:checked:bg-cyan-400";
      case "pink":
        return "checked:bg-pink-500 dark:checked:bg-pink-400";
      case "purple":
        return "checked:bg-purple-500 dark:checked:bg-purple-400";
      case "amber":
        return "checked:bg-amber-500 dark:checked:bg-amber-400";
      case "indigo":
        return "checked:bg-indigo-500 dark:checked:bg-indigo-400";
      case "gray":
        return "checked:bg-gray-500 dark:checked:bg-gray-400";
      default:
        return "checked:bg-brand-500 dark:checked:bg-brand-400";
    }
  })();

  return (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange?.(e.target.checked)} // Trigger onChange callback if provided
      className={`defaultCheckbox relative flex h-[20px] min-h-[20px] w-[20px] min-w-[20px] appearance-none items-center
      justify-center rounded-md border border-white text-white/0 outline-none transition duration-[0.2s]
      checked:border-none checked:text-white hover:cursor-pointer dark:border-white ${colorClass} ${className}`}
      name="weekly"
    />
  );
};

export default Checkbox;

