import { Component, OnInit } from '@angular/core';
import { DishService } from '../services/dish.service';
import { Params,ActivatedRoute} from '@angular/router';
import { Location } from '@angular/common';
import { Dish } from '../shared/dish';
import { switchMap } from 'rxjs/operators';
import { Comment } from '../shared/comment';
import { FormBuilder, FormGroup, Validators} from '@angular/forms';

@Component({
    selector: 'app-dishdetail',
    templateUrl: './dishdetail.component.html',
    styleUrls: ['./dishdetail.component.scss']
})
export class DishdetailComponent implements OnInit {

    visibility = 'shown';

    dish: Dish;
    dishIds: string[];
    prev : string;
    next : string;
    commentForm: FormGroup;
    comment: Comment;
    disherrMsg:string;
    dishcopy: Dish;

    formErrors = {
        'author': '',
        'comment': ''
    };

    validationMessages = {
        'author': {
          'required':      'Author Name is required.',
          'minlength':     'Author Name must be at least 2 characters long.',
          'maxlength':     'Author Name cannot be more than 25 characters long.'
        },
        'comment': {
          'required':      'Comment is required.',
          'minlength':     'Comment must be at least 1 characters long.'
        }
    };

    constructor(
        private fb:FormBuilder,
        private dishservice: DishService,
        private route: ActivatedRoute,
        private location: Location,) {
            this.createForm();
         }

    ngOnInit() {
        this.dishservice.getDishIds().subscribe(dishIds => this.dishIds = dishIds);
        this.route.params.pipe(switchMap((params:Params) => this.dishservice.getDish(params['id'])))
        .subscribe(dish => { 
            this.dish = dish;
            this.dishcopy = dish;
            this.setPrevNext(dish.id);
            this.visibility = 'shown';},
        errmess => this.disherrMsg = <any>errmess);
        }
    
    
    
    createForm() {
        this.commentForm = this.fb.group({
          author: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(25)] ],
          comment: ['', [Validators.required, Validators.minLength(1)] ],
          rating: 5
        });
    
        this.commentForm.valueChanges
        .subscribe(data => this.onValueChanged(data));
    
        this.onValueChanged(); // (re)set validation messages now
      }

    setPrevNext(dishId : string) {
        const index = this.dishIds.indexOf(dishId);
        this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
        this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
    }

    goBack() : void {
        this.location.back();
    }

    onSubmit() {
        this.comment = this.commentForm.value;
        this.comment.date = new Date().toISOString();
        this.dishcopy.comments.push(this.comment);
        console.log(this.comment);
        this.dishservice.putDish(this.dishcopy).subscribe(
          dish => {  this.dish = dish; this.dishcopy = dish;},
          errmess => { this.dish = null; this.dishcopy = null; this.disherrMsg = <any>errmess; });
        this.comment = null;
        this.commentForm.reset({
          author: '',
          comment: '',
          rating: 5
        });
      }

    onValueChanged(data?: any) {
        if (!this.commentForm) { return; }
        const form = this.commentForm;
        for (const field in this.formErrors) {
          // clear previous error message (if any)
          this.formErrors[field] = '';
          const control = form.get(field);
          if (control && control.dirty && !control.valid) {
            const messages = this.validationMessages[field];
            for (const key in control.errors) {
              this.formErrors[field] += messages[key] + ' ';
            }
          }
        }
        this.comment = form.value;
      }
}
