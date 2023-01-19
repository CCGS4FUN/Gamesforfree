import Button from 'Components/shared/Button';
import Toggle from 'Components/shared/Toggle';
import { faClose, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { Component } from 'react';
import { getCookie, setCookie } from 'modules/cookies';
import './Settings.scss';

class Settings extends Component {
	constructor() {
		super();

		this.state = {
			tabCloaker: getCookie('tabCloaker') === 'true' ? true : false,
		};

		this.toggleFavoriteIcon();
		this.toggleDocumentTitle();
	}

	toggleDocumentTitle() {
		if (this.state.tabCloaker) {
			document.title = 'My Drive';

			return;
		}

		document.title = 'Tam Games';
	}

	toggleFavoriteIcon() {
		if (this.state.tabCloaker) {
			document.querySelector('link[rel=icon]').href =
				'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/2295px-Google_Drive_icon_%282020%29.svg.png';

			return;
		}

		document.querySelector('link[rel=icon]').href =
			'https://github.com/nekumelon/TamGames/blob/main/src/assets/images/logoSmall.png?raw=true';
	}

	toggleTabCloaker() {
		this.setState(
			{
				tabCloaker: !this.state.tabCloaker,
			},
			() => {
				this.toggleFavoriteIcon();
				this.toggleDocumentTitle();
			}
		);

		setCookie('tabCloaker', !this.state.tabCloaker);
	}

	render() {
		return (
			<div className='settings-container'>
				<div className='settings'>
					<Toggle
						label='Tab Cloaker'
						enabled={this.state.tabCloaker}
						enabledIcon={faEye}
						disabledIcon={faEyeSlash}
						onChange={this.toggleTabCloaker.bind(this)}
					/>
					<Button
						onClick={this.props.closeSettings}
						label='Close'
						icon={faClose}
					/>
				</div>
			</div>
		);
	}
}

export default Settings;
