import { createRef, useEffect, useState } from "react";
import BUILD_CONIFG from "../../../../build.config";

export type IconProps = {
	icon: 'alert.svg' | 'dice.png' | 'house.png' | 'info.svg' | 'payment.svg',
	hover_icon?: IconProps['icon'],
	alt?: string
} & { className?: string, style?: React.CSSProperties, onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void };


function Icon(props: IconProps) {
	const [hover, setHover] = useState<boolean>(false);
	const ref = createRef<HTMLDivElement>();

	useEffect(() => {
		const ue_EnableHover = () => {
			setHover(true);
		}
		const ue_DisableHover = () => {
			setHover(false);
		}
		//add event listener on hover 
		if (ref.current && props?.hover_icon) {
			ref.current.addEventListener('mouseenter', ue_EnableHover);
			ref.current.addEventListener('mouseleave', ue_DisableHover);
		}

		return () => {
			if (ref.current && props?.hover_icon) {
				ref.current.removeEventListener('mouseenter', ue_EnableHover);
				ref.current.removeEventListener('mouseleave', ue_DisableHover);
			}
		}

	}, [])

	return (
		<div className="flex center-flex" onClick={e => { props?.onClick && props?.onClick(e) }} ref={ref}>
			<img src={hover ? `${BUILD_CONIFG.webPath}icon/${props.hover_icon}` : `/icon/${props.icon}`} alt={props.alt ?? 'icon'} className={`${props.className && props.className}`} style={props.style} draggable={false} />
		</div>
	)
}

export default Icon
