import { useEffect, useMemo, useRef, useState, UIEvent } from 'react';
import { RoleType } from '../../interface/modelInterfaces';
import { ServiceConfig } from '../../services/ServiceConfig';
import logger from '../../utility/logger';

export type FieldCoordinatorOption = { id: string; name: string };
const EMPTY_OPTIONS: FieldCoordinatorOption[] = [];
const PAGE_SIZE = 20;

export function useFieldCoordinatorOptions(
  selectedIds: string[],
  assignedOptions = EMPTY_OPTIONS,
  enabled = true,
  programId?: string,
) {
  const api = ServiceConfig.getI().apiHandler;
  const [search, setSearch] = useState('');
  const [available, setAvailable] = useState<FieldCoordinatorOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const cache = useRef(new Map<string, FieldCoordinatorOption>());
  const loadMore = useRef<() => void>(() => {});

  useEffect(() => {
    cache.current.clear();
    setSearch('');
  }, [enabled, programId]);

  useEffect(() => {
    let active = true;
    let busy = false;
    let page = 0;
    let hasMore = true;
    setAvailable([]);
    setError(false);
    setLoading(enabled);
    loadMore.current = () => {};
    if (!enabled) return;

    const fetchNextPage = async () => {
      if (!active || busy || !hasMore) return;
      busy = true;
      setLoading(true);
      setError(false);
      try {
        const response = await api.getManagersAndCoordinators(
          page + 1,
          search.trim(),
          PAGE_SIZE,
          'name',
          'asc',
          RoleType.FIELD_COORDINATOR,
        );
        if (!active) return;
        const nextOptions = response.data.map(({ user }) => ({
          id: user.id,
          name: user.name || user.email || user.phone || user.id,
        }));
        nextOptions.forEach((option) => cache.current.set(option.id, option));
        setAvailable((current) =>
          Array.from(
            new Map(
              [...current, ...nextOptions].map((option) => [option.id, option]),
            ).values(),
          ),
        );
        page += 1;
        hasMore =
          response.data.length > 0 && page * PAGE_SIZE < response.totalCount;
      } catch (loadError) {
        logger.error('Error loading Field Coordinators:', loadError);
        if (active) setError(true);
      } finally {
        busy = false;
        if (active) setLoading(false);
      }
    };

    const timer = setTimeout(
      () => {
        loadMore.current = fetchNextPage;
        void fetchNextPage();
      },
      search ? 300 : 0,
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [api, enabled, programId, search]);

  const options = useMemo(() => {
    const byId = new Map(cache.current);
    assignedOptions.forEach((option) => byId.set(option.id, option));
    const selected = new Set(selectedIds);
    return [
      ...selectedIds.flatMap((id) => {
        const option = byId.get(id);
        return option ? [option] : [];
      }),
      ...Array.from(
        new Map(
          [...assignedOptions, ...available].map((option) => [
            option.id,
            option,
          ]),
        ).values(),
      ).filter(
        (option) =>
          !selected.has(option.id) &&
          (!search ||
            option.name.toLowerCase().includes(search.trim().toLowerCase())),
      ),
    ];
  }, [assignedOptions, available, selectedIds, search]);

  const onScroll = (event: UIEvent<HTMLElement>) => {
    const list = event.currentTarget;
    if (list.scrollTop + list.clientHeight >= list.scrollHeight - 20) {
      loadMore.current();
    }
  };

  return { options, loading, error, search, setSearch, onScroll };
}
