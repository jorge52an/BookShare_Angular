import { Component, OnInit, ViewEncapsulation, ElementRef, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { FileUploader } from "ng2-file-upload";

import { User } from "../../models/user";
import { Interest } from "../../models/interest";
import { Product } from "../../models/product";

import { UserService } from "../../services/user.service";
import { ProductService } from "../../services/product.service";
import { LoaderService } from "../../services/loader.service";
import { AppSettings } from "../../app.settings";

@Component(
{
	selector: "profile",
	templateUrl: "./profile.component.html",
	styleUrls: ["./profile.component.scss"],
	encapsulation: ViewEncapsulation.None
} )

export class ProfileComponent implements OnInit
{
	uploader: FileUploader;
	profileForm: FormGroup;
	user: User;
	password: any;
	interests: Array<Interest>;
	submitted: boolean;
	photoURL: string;
	profileImage: string;
	server: string;
	mode: string;
	ownProfile:  boolean;
	productsAvailable: Array<Product>;
	productsUnavailable: Array<Product>;
	editingMode: boolean;
	userAux: User;
	otherUser:any;
	otherUserId:string;

	@ViewChild( "fileInput" ) fileInput: ElementRef;

	constructor( private userService: UserService,
		private productService: ProductService,
		private loaderService: LoaderService,
		private route: ActivatedRoute,
		private router: Router,
		private formBuilder: FormBuilder )
	{
		this.photoURL = `${AppSettings.API_ENDPOINT}/users`;
		this.password = {
			value: "",
			confirmation: ""
		};
		this.profileForm = this.createProfileForm();
		this.submitted = false;
		this.profileImage = "https://x1.xingassets.com/assets/frontend_minified/img/users/nobody_m.original.jpg";
		this.server = AppSettings.SERVER;
		this.mode = "view";
		this.ownProfile = true;
		this.productsAvailable = [];
		this.productsUnavailable = [];
		this.editingMode = false;
	}

	private mismatch(): ValidatorFn
	{
		return ( control: AbstractControl ): { [key: string]: any } =>
		{
			let input: string = control.value;
			let password: string = this.password.value;
			let isValid: boolean = password !== input;
			if( isValid )
				return { mismatch: { password } }
			else
				return null;
		};
	}

	private emailExists(): ValidatorFn
	{
		return ( control: AbstractControl ): { [key: string]: any } =>
		{
			return new Promise( resolve =>
				{
					let input: string = control.value

					if( this.user.email === this.userAux.email )
						resolve( null );

					this.userService.existsWithEmail( input )
						.then( data =>
						{
							if( data.exists )
								resolve( { emailExists: true } );
							else
								resolve( null );
						} )
						.catch( response =>
						{
							resolve( null );
						} );
				} );
		}
	}

	private selectInterest( index: number ): void
	{
		if( this.mode === "view" )
			return;

		let exists: boolean = false;
		for( let i = 0; i < this.user.interests.length; ++i )
			if( this.user.interests[i].id === this.interests[index].id )
			{
				this.user.interests.splice( i, 1 );
				exists = true;
				break;
			}
		if( !exists )
			this.user.interests.push( this.interests[index] );
	}

	private showInputFileDialog( fileInput: any ): void
	{
		if( this.mode === "view" )
			return;
		this.fileInput.nativeElement.click();
	}

	private updatePhoto(): void
	{
		let fileReader: FileReader = new FileReader();

		fileReader.onload = this.completeOnLoadPhoto.bind( this );
		fileReader.readAsDataURL( this.uploader.queue[this.uploader.queue.length - 1]._file );
	}

	private completeOnLoadPhoto( e: any ): void
	{
		this.profileImage = e.target.result;
	}

	private redirectToProduct( id: number ): void
	{
		this.router.navigate( ["/product", id] );
	}

	private redirectToCreateProduct(): void
	{
		this.router.navigate( ["/product"] );
	}

	private cancel(): void
	{
		this.mode = "view";
	}
	
	private modeView(): void
	{
		this.mode = "edit";
	}

	private createProfileForm(): FormGroup
	{
		return this.formBuilder.group(
			{
				name: ["", [Validators.required]],
				lastName: ["", [Validators.required]],
				email: ["", [Validators.required, Validators.pattern( /^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/ )],
					[this.emailExists()]]
			} );
	}

	private edit(): void
	{
		if( this.profileForm.invalid )
			return;
		
		if( this.uploader.queue.length > 0 )
		{
			this.loaderService.show();
			this.uploader.queue[this.uploader.queue.length - 1].upload();

			this.uploader.onSuccessItem = (item, response, status, headers ) =>
			{
				this.userService.update( this.user )
					.then( userObject =>
					{
						let data: any = {};
						data.token = this.user.token;
						data.data = userObject;
						this.userService.setUser( new User( data ), true );
						this.loaderService.hide();
						this.mode = "view";
					} )
					.catch( response =>
					{
						this.loaderService.hide();
						console.log( response );
					} );
			};
		}
		else
		{
			this.loaderService.hide();
			this.mode = "view";
		}
	}

	private checkContainsInterest( interest: Interest )
	{
		if( this.user )
			return this.user.interests.some( userInterest => userInterest.id === interest.id );
	}

	public ngOnInit()
	{
		for( let view in AppSettings.ACTIVES )
			AppSettings.ACTIVES[view] = false;
		
		this.productService.getInterests()
			.subscribe( interests =>
			{
				this.interests = interests;
			} );

		this.loaderService.show();
		this.route.params
			.subscribe( params =>
			{
				if( Object.keys( params ).length > 1 )
				{
					this.loaderService.hide();
					this.router.navigate( ["/home"] );
				}
				else if( Object.keys( params ).length === 0 )
				{
					this.userService.userState
						.subscribe( user =>
						{
							let id: number = user.id;
							let token: string = user.token;

							this.userService.get( id )
								.then( user =>
								{
									this.ownProfile = true;
									let data: any = {};
									data.data = user;
									data.token = token;
									this.user = new User( data );

									if( this.user.photo )
										this.profileImage = this.server + this.user.photo.image.url;
								
									this.userAux = Object.assign( {}, this.user ) as User;
				
									this.uploader = new FileUploader( {
										url: `${this.photoURL}/${this.user.id}/photos`,
										allowedMimeType: ["image/png", "image/jpg", "image/jpeg", "image/gif"],
										maxFileSize: 5242880,
										authToken: this.user.token
									} );
									
									this.productService.getByUser( this.user.id, true )
										.subscribe( result =>
										{
											let products: Array<any> = result;
											for( let i = 0; i < products.length; ++i )
												this.productsAvailable.push( new Product( products[i] ) );
										} );

									this.productService.getByUser( this.user.id, false )
										.subscribe( result =>
										{
											let products: Array<any> = result;
											for( let i = 0; i < products.length; ++i )
												this.productsUnavailable.push( new Product( products[i] ) );
										} );

									this.loaderService.hide();
								} )
								.catch( error =>
								{
									console.log( error );
									this.loaderService.hide();
								} );
						} );
				}
				else
				{
					this.userService.userState
						.subscribe( user =>
						{
							let id: number = user.id;
							let token: string = user.token;

							let idAux: number = +params["id"];
							if( !idAux )
								this.router.navigate( ["/home"] );

							this.userService.get( idAux )
								.then( user =>
								{
									this.ownProfile = id === idAux;
									let data: any = {};
									data.data = user;
									data.token = token;
									this.user = new User( data );

									if( this.user.photo )
										this.profileImage = this.server + this.user.photo.image.url;
								
									this.userAux = Object.assign( {}, this.user ) as User;
				
									if( this.ownProfile )
										this.uploader = new FileUploader( {
											url: `${this.photoURL}/${this.user.id}/photos`,
											allowedMimeType: ["image/png", "image/jpg", "image/jpeg", "image/gif"],
											maxFileSize: 5242880,
											authToken: this.user.token
										} );
									
									this.productService.getByUser( this.user.id, true )
										.subscribe( result =>
										{
											let products: Array<any> = result;
											for( let i = 0; i < products.length; ++i )
												this.productsAvailable.push( new Product( products[i] ) );
										} );

									if( this.ownProfile )
										this.productService.getByUser( this.user.id, false )
											.subscribe( result =>
											{
												let products: Array<any> = result;
												for( let i = 0; i < products.length; ++i )
													this.productsUnavailable.push( new Product( products[i] ) );
											} );

									this.loaderService.hide();
								} )
								.catch( error =>
								{
									console.log( error );
									this.loaderService.hide();
								} );
						} );
				}

				this.userService.getSessionStorageUser();
			} );
	}
}