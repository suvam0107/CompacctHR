// src/app/shared/components/search-input/search-input.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-input.html',
  styleUrls: ['./search-input.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchInput implements OnInit, OnDestroy {
  @Input() placeholder: string = 'Search...';
  @Input() debounceMs: number = 300;
  @Input() set value(val: string) {
    this.searchTerm = val || '';
  }

  @Output() searchChange = new EventEmitter<string>();
  @Output() searchSubmit = new EventEmitter<string>();
  @Output() searchClear = new EventEmitter<void>();

  searchTerm: string = '';
  private searchSubject = new Subject<string>();
  private subscription?: Subscription;

  ngOnInit(): void {
    this.subscription = this.searchSubject
      .pipe(
        debounceTime(this.debounceMs),
        distinctUntilChanged()
      )
      .subscribe(val => {
        this.searchChange.emit(val.trim());
      });
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    this.searchSubject.next(this.searchTerm);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.searchSubmit.emit(this.searchTerm.trim());
    } else if (event.key === 'Escape') {
      this.clear();
    }
  }

  clear(): void {
    this.searchTerm = '';
    this.searchSubject.next('');
    this.searchClear.emit();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
