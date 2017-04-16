import { Injectable } from "@angular/core";
import { Headers, Http, Response } from "@angular/http";
import { Observable } from "rxjs/Observable";
import "rxjs/add/operator/toPromise";
import "rxjs/add/operator/map";
import "rxjs/add/operator/catch";
 
import { Product } from "../classes/product";
 
@Injectable()
export class ProductService
{
	private headers: Headers;
	private productsURL: string;

	constructor( private http: Http )
	{
		this.headers = new Headers( { "Content-Type": "application/json" } );
		this.productsURL = "http://localhost:3000/api/v1/products";
	}

	private handlePromiseError( error: any ): Promise<any>
	{
		console.error( "An error occurred", error );
		return Promise.reject( error.message || error );
	}

	private handleError( error: Response | any )
	{
		let errMsg: string;
		if( error instanceof Response )
		{
			const body = error.json() || "";
			const err = body.error || JSON.stringify( body );
			errMsg = `${error.status} - ${error.statusText || ""} ${err}`;
		}
		else
		{
			errMsg = error.message ? error.message : error.toString();
		}
		console.error( errMsg );
		
		return Observable.throw( errMsg );
	}

	availables( page: number, perPage: number ): Observable<Product[]>
	{
		return this.http.get( `${this.productsURL}?page=${page}&per_page=${perPage}` )
			.map( ( r: Response ) => r.json().data as Product[] )
			.catch( this.handleError );
	}

	get( id: number ): Promise<any>
	{
		return this.http.get( `${this.productsURL}/${id}` ).toPromise()
			.then( response => response.json().data )
			.catch( this.handlePromiseError );
	}
}