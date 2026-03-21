"use client";

import React, { FC } from "react";
import ButtonSubmitBase from "@/shared/ButtonSubmit";

interface Props {
  className?: string;
  onClick?: () => void;
}

const ButtonSubmit: FC<Props> = ({ className = "", onClick = () => {} }) => {
  return (
    <ButtonSubmitBase
      variant="compact"
      onClick={onClick}
      className={`relative z-20 ${className}`}
    />
  );
};

export default ButtonSubmit;
