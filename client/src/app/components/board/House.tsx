import "../../styles/house.scss";

type HouseProps = {
	isHotel: boolean;
}

export function House() {
	return (
		<div className="house">
			<img src="/icon/house.png" alt="House" />
		</div>
	)
}
