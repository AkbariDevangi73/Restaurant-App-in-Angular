import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MatDialog,MatDialogConfig } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Customer } from 'src/app/shared/customer.model';
import { CustomerService } from 'src/app/shared/customer.service';
import { OrderItem } from 'src/app/shared/order-item.model';
import { Order } from 'src/app/shared/order.model';
import { OrderService } from 'src/app/shared/order.service';
import { OrderItemsComponent } from '../order-items/order-items.component';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.css']
})
export class OrderComponent implements OnInit {
  customerList:Customer[];
  isValid:boolean=true;

  constructor(public service:OrderService,
    private dialog:MatDialog,
    private customerService:CustomerService,
    private toastr:ToastrService,
    private router:Router,
    private currentRoute:ActivatedRoute) { }

  ngOnInit(): void {
    let orderID=this.currentRoute.snapshot.paramMap.get('id');
    if(orderID==null)
    this.resetForm();
    else{
      this.service.getOrderByID(parseInt(orderID)).then((res: { order: Order; orderDetails: OrderItem[]; })=>{
        this.service.formData=res.order;
        this.service.orderItems=res.orderDetails;
      });
    }

    this.customerService.getCustomerList().then(res=>this.customerList=res as Customer[]);
  }

  resetForm(form?:NgForm)
  {
    if(form)
    form.resetForm();
    this.service.formData ={
      OrderID:0,
      OrderNo:Math.floor(100000+Math.random()*900000).toString(),
      CustomerID:0,
      PMethod:'',
      GTotal:0,
      DeletedOrderItemIDs:''
    };
    this.service.orderItems=[];
  }

  AddOrEditOrderItem(OrderItemIndex: any,OrderID: any){
    const dialogConfig=new MatDialogConfig();
    dialogConfig.autoFocus=true;
    dialogConfig.disableClose=true;
    dialogConfig.width="50%";
    dialogConfig.data={OrderItemIndex,OrderID}
    this.dialog.open(OrderItemsComponent,dialogConfig).afterClosed().subscribe(res=>{
      this.updateGrandTotal();
    });
  }

  onDeleteOrderItem(OrderItemID:number,i:number){
    if(OrderItemID!=null)
    this.service.formData.DeletedOrderItemIDs+=OrderItemID+",";
      this.service.orderItems.splice(i,1);
      this.updateGrandTotal();
  }

  updateGrandTotal(){
    this.service.formData.GTotal=this.service.orderItems.reduce((prev,curr)=>{
      return prev+curr.Total;
    },0);

    this.service.formData.GTotal=parseFloat((this.service.formData.GTotal).toFixed(2));
  }

  validateForm(){
    this.isValid=true;
    if(this.service.formData.CustomerID==0)
    this.isValid=false;
    else if(this.service.orderItems.length==0)
    this.isValid=false;
    return this.isValid;
  }

  onSubmit(form:NgForm){
    if(this.validateForm())
    {
       this.service.saveOrUpdateOrder().subscribe(res=>{
         this.resetForm();     
         this.toastr.success('Submitted Succefully','Restaurant App.');
         this.router.navigate(['/orders']);
       });
    }
  }
}
