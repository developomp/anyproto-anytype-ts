import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Error, Textarea, Button, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { I, Storage, translate, C } from 'ts/lib';
import { commonStore, authStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {};
interface State {
	error: string;
};

const { ipcRenderer } = window.require('electron');

@observer
class PageAuthLogin extends React.Component<Props, State> {

	phraseRef: any;

	state = {
		error: ''
	};
	
	constructor (props: any) {
		super(props);

		this.onSubmit = this.onSubmit.bind(this);
		this.onCancel = this.onCancel.bind(this);
	};
	
	render () {
		const { cover } = commonStore;
		const { error } = this.state;
		
        return (
			<div>
				<Cover {...cover} />
				<Header />
				<Footer />
				
				<Frame>
					<Title text={translate('authLoginTitle')} />
					<Label text={translate('authLoginLabel')} />
					<Error text={error} />
							
					<form onSubmit={this.onSubmit}>
						<Textarea ref={(ref: any) => this.phraseRef = ref} placeHolder={translate('authLoginPhrase')} />
						<div className="buttons">
							<Button type="input" text={translate('authLoginLogin')} className="orange" />
							<Button text={translate('authLoginBack')} className="grey" onClick={this.onCancel} />
						</div>
					</form>
				</Frame>
			</div>
		);
	};

	componentDidMount () {
		this.phraseRef.focus();
	};
	
	componentDidUpdate () {
		this.phraseRef.focus();
	};

	onSubmit (e: any) {
		e.preventDefault();
		
		const { history } = this.props;
		const { path } = authStore;
		const phrase = this.phraseRef.getValue();
		
		this.phraseRef.setError(false);
		
		C.WalletRecover(path, phrase, (message: any) => {
			if (message.error.code) {
				this.phraseRef.setError(true);
				this.setState({ error: message.error.description });
			} else {
				authStore.phraseSet(phrase);
				ipcRenderer.send('keytarSet', 'phrase', phrase);
				history.push('/auth/account-select');
			};
		});
	};
	
	onCancel (e: any) {
		this.props.history.push('/auth/select');
	};
	
};

export default PageAuthLogin;